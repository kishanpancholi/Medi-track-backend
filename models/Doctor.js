import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    gender: { type: String},
    dob: { type: String},
    specialization: { type: String},
    qualification: { type: String},
    mobile: { type: String},
    email: { type: String, required: true, unique: true, lowercase: true },
    address: { type: String},
    password: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Doctor", doctorSchema);
