import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["physical", "videocall"],
    // default: "physical",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed", "cancelled"],
    default: "pending", // automatic
  },
  meetingLink: {
    type: String,
    default: null,
  },
  reviewHandled: {
  type: Boolean,
  default: false
}
}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);