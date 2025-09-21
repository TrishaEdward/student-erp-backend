import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Helper to parse JSON
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

// Create User Route
export async function createUserRoute(req, res) {
  if (req.url === "/api/create-user" && req.method === "POST") {
    try {
      const body = await parseRequestBody(req);

      const hashedPassword = await bcrypt.hash(body.password || "default123", 10);

      const newUser = new User({
        name: body.name,
        email: body.email,
        password: hashedPassword,
        userRole: body.userRole || "student",
      });

      await newUser.save();

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "✅ User created", user: newUser }));
    } catch (err) {
      console.error("❌ Error creating user:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Failed to create user" }));
    }
  }
}
