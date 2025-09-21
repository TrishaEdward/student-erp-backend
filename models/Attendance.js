import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g., "9:00-10:00"
  status: { type: String, enum: ["Present", "Absent"], default: "Present" },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
