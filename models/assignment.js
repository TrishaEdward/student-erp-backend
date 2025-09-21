import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  status: { type: String, default: "Not Completed" },
  file: String // uploaded PDF by student
});

const assignmentSchema = new mongoose.Schema({
  name: String,
  file: String, // uploaded PDF by admin
  submissions: [submissionSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Assignment", assignmentSchema);
