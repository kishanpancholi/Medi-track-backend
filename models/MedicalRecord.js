import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["lab", "scan", "prescription"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    description: String,
    fileUrl: String,
    uploadedBy: {
      type: String,
      enum: ["patient", "doctor"],
      default: "patient",
    },
  },
  { timestamps: true }
);

export default mongoose.model("MedicalRecord", medicalRecordSchema);