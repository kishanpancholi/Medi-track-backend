import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    gender: { type: String },
    dob: { type: String },
    specialization: { type: String, required: true },
    qualification: { type: String, required: true  },
    mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    profilePic: { type: String },
    experience: { type: String, required: true },
    licenseNumber: { type: String, required: true },

    workingDays: [{ type: String }],
    workingHours: { type: String },

    clinicName: { type: String },
    clinicAddress: { type: String },

    city: { type: String },
    state: { type: String },
    mapLink: { type: String },

    about: { type: String },
    emergencyContact: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Doctor", doctorSchema);
