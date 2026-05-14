import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      set: (value) => {
        if (!value) return value;
        return value.replace(/^dr\.?\s*/i, "").trim();
      },
    },
    gender: { type: String },
    dob: { type: String },
    specialization: { type: String, required: true },
    qualification: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    experience: { type: Number, required: true },
    licenseNumber: { type: String, required: true, unique: true },

    workingDays: [{ type: String }],
    workingHours: [
      {
        start: { type: String, required: true }, // "09:00"
        end: { type: String, required: true }, // "12:00"
      },
    ],
    clinicName: { type: String },
    clinicAddress: { type: String },

    city: { type: String },
    state: { type: String },
    mapLink: { type: String },

    otp: { type: String },
    otpExpire: { type: Date },

    about: { type: String },
    emergencyContact: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    serviceType: {
      type: [String],
      enum: ["physical", "videocall"],
      default: ["physical"],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Doctor", doctorSchema);