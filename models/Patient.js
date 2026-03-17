import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim:true},
    lastName: { type: String, required: true, trim:true},
    gender: { type: String, required: true },
    dob: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase:true},
    address: { type: String, required: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);