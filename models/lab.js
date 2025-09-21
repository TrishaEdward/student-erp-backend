import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ["Not Completed", "Completed"], default: "Not Completed" },
  file: { type: String, default: null } // Cloudinary file URL
});

const labSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    file: { type: String, required: true },          // Cloudinary URL for lab file
    originalFileName: { type: String, required: true }, // Original uploaded filename
    submissions: { type: [submissionSchema], default: [] }
  },
  { timestamps: true }
);

const Lab = mongoose.model("Lab", labSchema);
export default Lab;
