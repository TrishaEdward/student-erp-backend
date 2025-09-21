import mongoose from "mongoose";

const markSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",           // reference to User model
    required: true 
  },
  course: { type: String, required: true },
  outOf: { type: Number, required: true },
  obtained: { type: Number, required: true }
});

// we can also create an index for faster lookups
markSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model("Mark", markSchema);
