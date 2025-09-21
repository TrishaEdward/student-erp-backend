import "dotenv/config"; // ✅ Loads .env automatically, no need for dotenv import
import http from "http";
import mongoose from "mongoose";

import { loginRoute } from "./routes/loginRoute.js";
import { createUserRoute } from "./routes/userRoutes.js";
import { markAttendance, getAttendance, getAttendanceSummary } from "./routes/attendanceRoutes.js";
import { userList } from "./routes/userlist.js";
import { markStudentMarks, getStudentMarks } from "./routes/marksRoute.js";
import { assignmentRoute } from "./routes/assignmentsRoute.js";


// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;

const server = http.createServer(async (req, res) => {
  // ✅ Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  try {
    // ✅ Routes
    await createUserRoute(req, res);
    await loginRoute(req, res);
    await markAttendance(req, res);
    await getAttendance(req, res);
    await getAttendanceSummary(req, res);
    await userList(req, res);
    await markStudentMarks(req, res);
    await getStudentMarks(req, res);
    await assignmentRoute(req, res);
    if (!res.writableEnded) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Route not found" }));
    }
  } catch (err) {
    console.error("❌ Server error:", err);
    if (!res.writableEnded) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
});

server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
