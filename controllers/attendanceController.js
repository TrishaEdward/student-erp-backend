// controllers/attendanceController.js
import Attendance from "../models/Attendance.js";

export async function handleMarkAttendance(req, res, body) {
  try {
    const { studentId, subject, date, status } = JSON.parse(body);
    const record = await Attendance.create({ studentId, subject, date, status });

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Attendance marked", record }));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleGetAttendance(req, res, studentId) {
  try {
    const records = await Attendance.find({ studentId }).populate("studentId", "name email");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(records));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}
