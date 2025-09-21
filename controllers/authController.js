// controllers/authController.js
import User from "../models/User.js";

export async function handleRegister(req, res, body) {
  try {
    const { name, email, password, role } = JSON.parse(body);
    const user = await User.create({ name, email, password, role });

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "User created", user }));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleLogin(req, res, body) {
  try {
    const { email, password } = JSON.parse(body);
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Invalid credentials" }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Login successful", role: user.role, userId: user._id }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}
