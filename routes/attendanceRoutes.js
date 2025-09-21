
import Attendance from "../models/Attendance.js";
import { parseRequestBody } from "./loginRoute.js"; // reuse JSON parser
import mongoose from "mongoose";

export async function markAttendance(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/attendance" && req.method === "POST") {
    try {
      const body = await parseRequestBody(req);
      const { studentId, subject, date, time, status } = body;

      if (!studentId || !subject || !date || !time || !status) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Missing required fields" }));
      }

      let attendance = await Attendance.findOne({
        studentId,
        date: new Date(date),
        time,
      });

      if (attendance) {
        attendance.status = status;
      } else {
        attendance = new Attendance({
          studentId,
          subject,
          date: new Date(date),
          time,
          status,
        });
      }

      await attendance.save();

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Attendance marked", attendance }));
    } catch (err) {
      console.error("❌ Error marking attendance:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Server error" }));
    }
  }
}

export async function getAttendance(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/attendance" && req.method === "GET") {
    try {
      const studentId = url.searchParams.get("studentId");
      const subject = url.searchParams.get("subject");
      const date = url.searchParams.get("date");
      const time = url.searchParams.get("time");

      const filter = {};
      if (studentId) filter.studentId = studentId;
      if (subject) filter.subject = subject;
      if (date) filter.date = new Date(date);
      if (time) filter.time = time;

      const attendance = await Attendance.find(filter).populate("studentId", "name email");

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(attendance));
    } catch (err) {
      console.error("❌ Error fetching attendance:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Server error" }));
    }
  }
}

export async function getAttendanceSummary(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/attendance-summary" && req.method === "GET") {
    try {
      const studentId = url.searchParams.get("studentId");
      if (!studentId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Missing studentId" }));
      }

      // Fetch all attendance records for this student
      const records = await Attendance.find({
        studentId: new mongoose.Types.ObjectId(studentId), // ✅ fixed
      });

      // Predefined subjects
      const subjects = [
        "Internet and web programming",
        "Design and analysis of algorithms",
        "Cryptography",
        "Cloud Computing",
        "Software and project management",
        "AI and machine learning",
      ];

      // Initialize counts for each subject
      const subjectMap = {};
      subjects.forEach((subj) => {
        subjectMap[subj] = { present: 0, total: 0 };
      });

      // Count present/total for each subject
      let totalPresent = 0;
      let totalClasses = 0;

      records.forEach((r) => {
        if (!subjectMap[r.subject]) {
          // In case a new subject was added dynamically
          subjectMap[r.subject] = { present: 0, total: 0 };
        }
        subjectMap[r.subject].total++;
        if (r.status === "Present") {
          subjectMap[r.subject].present++;
          totalPresent++;
        }
        totalClasses++;
      });

      // Prepare per-subject summary
      const perSubject = subjects.map((subj) => {
        const data = subjectMap[subj];
        const percentage = data.total
          ? ((data.present / data.total) * 100).toFixed(2) + "%"
          : "0%";
        return { subject: subj, percentage };
      });

      // Overall percentage
      const overallPercentage = totalClasses
        ? ((totalPresent / totalClasses) * 100).toFixed(2) + "%"
        : "0%";

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ perSubject, overallPercentage }));
    } catch (err) {
      console.error("❌ Error fetching attendance summary:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Server error" }));
    }
  }
}
