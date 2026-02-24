import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    fname: { type: String, required: true },
    lname: { type: String, required: true },
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