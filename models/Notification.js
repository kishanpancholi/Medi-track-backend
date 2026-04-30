import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "role", // 🔥 dynamic ref (Patient / Doctor)
    },

    role: {
      type: String,
      enum: ["Patient", "Doctor"],
      required: true,
    },

    type: {
      type: String,
      enum: [
        "appointment_booked",
        "appointment_request",
        "appointment_approved",
        "appointment_rejected",
        "appointment_cancelled",
        "appointment_rescheduled",
        "appointment_completed",
        "record_uploaded",
        "prescription_added",
        "prescription_added",
        "prescription_updated",
        "prescription_status_updated",
        "medicine_status_updated",
        "review_added",
      ],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    link: {
      type: String, // where to redirect on click
      default: "/",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);