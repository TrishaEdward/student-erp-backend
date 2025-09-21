// routes/marksRoute.js
import Mark from "../models/Marks.js";
import User from "../models/User.js";

// POST /marks
export async function markStudentMarks(req, res) {
  if (req.url === "/marks" && req.method === "POST") {
    try {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }
      const { studentId, marks } = JSON.parse(body);

      const student = await User.findById(studentId);
      if (!student || student.userRole !== "student") {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Student not found" }));
      }

      for (const m of marks) {
        await Mark.findOneAndUpdate(
          { student: studentId, course: m.course },
          { student: studentId, course: m.course, outOf: m.outOf, obtained: m.obtained },
          { new: true, upsert: true }
        );
      }

      const savedMarks = await Mark.find({ student: studentId });
      const totalObtained = savedMarks.reduce((acc, m) => acc + m.obtained, 0);
      const totalOutOf = savedMarks.reduce((acc, m) => acc + m.outOf, 0);
      const percentage = ((totalObtained / totalOutOf) * 100).toFixed(2);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        message: "Marks saved successfully",
        student: student.name,
        marks: savedMarks,
        percentage: percentage + "%"
      }));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Server error" }));
    }
  }
}

// GET /marks/:studentId
export async function getStudentMarks(req, res) {
  const match = req.url.match(/^\/marks\/([a-f\d]{24})$/); // mongo ObjectId regex
  if (match && req.method === "GET") {
    try {
      const studentId = match[1];
      const student = await User.findById(studentId);
      if (!student || student.userRole !== "student") {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Student not found" }));
      }

      const marks = await Mark.find({ student: studentId });
      if (!marks.length) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "No marks found for this student" }));
      }

      const totalObtained = marks.reduce((acc, m) => acc + m.obtained, 0);
      const totalOutOf = marks.reduce((acc, m) => acc + m.outOf, 0);
      const percentage = ((totalObtained / totalOutOf) * 100).toFixed(2);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        student: student.name,
        marks,
        percentage: percentage + "%"
      }));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Server error" }));
    }
  }
}
