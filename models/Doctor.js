import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    gender: { type: String },
    dob: { type: String },
    specialization: { type: String },
    qualification: { type: String },
    mobile: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    profilePic: { type: String },
    experience: { type: String },
    licenseNumber: { type: String },

    workingDays: [{ type: String }],
    workingHours: { type: String },

    clinicName: { type: String },
    clinicAddress: { type: String },

    city: { type: String },
    state: { type: String },
    mapLink: { type: String },

    about: { type: String },
    emergencyContact: { type: String },

    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Doctor", doctorSchema);
