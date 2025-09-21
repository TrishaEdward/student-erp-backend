import bcrypt from "bcryptjs";
import User from "../models/User.js";
export function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

export async function loginRoute(req, res) {
  if (req.url === "/api/login" && req.method === "POST") {
    try {
      const body = await parseRequestBody(req);
      const { email, password } = body;

      if (!email || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Email and password required" }));
      }

      const user = await User.findOne({ email });
      if (!user) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid credentials" }));
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid credentials" }));
      }

      // ✅ Return _id and userRole
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        _id: user._id,
        userRole: user.userRole,
        name: user.name,
        email: user.email
      }));
    } catch (err) {
      console.error("❌ Login error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Server error" }));
    }
  }
}
