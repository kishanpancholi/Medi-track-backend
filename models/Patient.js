import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim:true},
    lastName: { type: String, required: true, trim:true},
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    dob: { type: Date, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase:true},
    password: { type: String, required: true },

    // Address Fields
    address: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    
    // Profile Fields
    bloodGroup: { type: String },
    allergies: { type: String },
    diseases: [{ type: String }], //array
    medications: { type: String },//current
    weight: { type: Number },

    // Emergency Contact
    emergencyContact: {
      name: { type: String },
      mobile: { type: String },
      relationship: { type: String },
    },
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);