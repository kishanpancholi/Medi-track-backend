import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      refPath: "role",
    },

    role: {
      type: String,
      enum: ["Patient", "Doctor", "Admin", "ALL"],
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
        "prescription_updated",
        "prescription_status_updated",
        "medicine_status_updated",
        "review_added",
        "admin_message",
        "patient_registered",
        "patient_profile_completed",
        "patient_profile_updated",
        "patient_login",
        "patient_password_reset",
        "otp_sent",
        "otp_verified",
        "doctor_registered",
        "doctor_login", 
        "doctor_profile_completed",
        "doctor_profile_updated",
        "doctor_status_updated",
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