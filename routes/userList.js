// routes/userlist.js
import User from "../models/User.js"; // your User schema

// GET /api/userlist  — return all students
export async function userList(req, res) {
  if (req.url === "/api/userlist" && req.method === "GET") {
    try {
      // fetch only users whose role is "student"
      const students = await User.find({ userRole: "student" }).select("name email userRole");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(students));
    } catch (err) {
      console.error("❌ Error fetching students:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Server error" }));
    }
  }
}
