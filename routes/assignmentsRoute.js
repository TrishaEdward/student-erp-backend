import Assignment from "../models/assignment.js";
import fetch from "node-fetch";
import multer from "multer";
import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const storage = multer.memoryStorage();
const upload = multer({ storage });

function runMulter(req) {
  return new Promise((resolve, reject) => {
    upload.single("file")(req, null, (err) => {
      if (err) {
        console.error("❌ Multer error:", err);
        reject(err);
      } else {
        console.log("✅ Multer file parsed:", req.file?.originalname);
        resolve(req.file);
      }
    });
  });
}

async function fetchStudents() {
  console.log("📡 Fetching student list from API...");
  const res = await fetch("https://student-erp-backend-5qi0.onrender.com/api/userlist");
  if (!res.ok) throw new Error("Failed to fetch students");
  const students = await res.json();
  console.log(`✅ Found ${students.length} students`);
  return students;
}

async function uploadBufferToCloudinary(buffer, publicId) {
  console.log("☁️ Uploading file to Cloudinary:", publicId);
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: publicId,
        type: "upload",
        access_mode: "public",
        overwrite: true
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload failed:", error);
          return reject(error);
        }
        console.log("✅ Cloudinary upload success. Secure URL:", result.secure_url);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

function sendJson(res, statusCode, data) {
  if (!res.writableEnded) {
    console.log(`📤 Sending JSON response: ${statusCode}`, data);
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }
}

export async function assignmentRoute(req, res) {
  try {
    // --- GET all assignments (admin) ---
    if (req.url === "/assignments" && req.method === "GET") {
      const assignments = await Assignment.find({});
      return sendJson(res, 200, assignments);
    }

    // --- GET assignments for student ---
    if (req.url.startsWith("/assignments/student") && req.method === "GET") {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const studentId = urlObj.searchParams.get("studentId");
      if (!studentId) return sendJson(res, 400, { error: "studentId is required" });

      const assignments = await Assignment.find({}, { name: 1, submissions: 1 });

      const result = assignments.map(a => {
        const sub = a.submissions.find(s => String(s.studentId) === String(studentId));
        const status = sub ? sub.status : "Not Assigned";
        return {
          assignmentId: a._id,
          name: a.name,
          status
        };
      });

      return sendJson(res, 200, result);
    }

    // --- POST new assignment (admin) ---
    if (req.url === "/assignments" && req.method === "POST") {
      const file = await runMulter(req);
      if (!file) return sendJson(res, 400, { error: "No file uploaded" });

      const assignmentName = req.body?.name || file.originalname;

      const cloudResult = await uploadBufferToCloudinary(
        file.buffer,
        `assignments/${Date.now()}-${file.originalname}`
      );

      if (!cloudResult.secure_url) return sendJson(res, 500, { error: "Cloud upload failed" });

      const students = await fetchStudents();

      const newAssignment = new Assignment({
        name: assignmentName,
        file: cloudResult.secure_url,
        originalFileName: file.originalname,
        submissions: students.map(s => ({
          studentId: s._id,
          name: s.name,
          status: "Not Completed",
          file: null
        }))
      });

      await newAssignment.save();
      return sendJson(res, 200, newAssignment);
    }

    // --- POST student submission ---
    if (req.url.startsWith("/assignments/") && req.url.includes("/submit") && req.method === "POST") {
      const assignmentId = req.url.split("/")[2];

      const file = await runMulter(req);
      if (!file) return sendJson(res, 400, { error: "No file uploaded" });

      const studentId = req.body?.studentId;
      if (!studentId) return sendJson(res, 400, { error: "Student ID is required" });

      console.log("🧪 Incoming studentId:", studentId);

      const cloudResult = await uploadBufferToCloudinary(
        file.buffer,
        `submissions/${Date.now()}-${file.originalname}`
      );

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) return sendJson(res, 404, { error: "Assignment not found" });

      console.log("📋 Existing submission IDs:", assignment.submissions.map(s => String(s.studentId)));

      let submission = assignment.submissions.find(
        s => String(s.studentId) === String(studentId)
      );

      if (!submission) {
        console.warn("⚠️ Student not found in submissions. Creating new entry.");
        submission = {
          studentId,
          name: "Unknown",
          status: "Completed",
          file: cloudResult.secure_url
        };
        assignment.submissions.push(submission);
      } else {
        submission.status = "Completed";
        submission.file = cloudResult.secure_url;
      }

      await assignment.save();
      console.log("✅ Submission saved for student:", studentId);
      return sendJson(res, 200, { message: "Assignment submitted", submission });
    }

    return sendJson(res, 404, { error: "Route not found" });

  } catch (err) {
    console.error("💥 Uncaught error in assignmentRoute:", err);
    return sendJson(res, 500, { error: err.message });
  }
}
