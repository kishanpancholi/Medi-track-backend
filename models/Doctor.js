import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    // gender: { type: String, required: true },
    // dob: { type: String, required: true },

    // specialization: { type: String, required: true },
    // qualification: { type: String, required: true },

    // mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },

    // address: { type: String, required: true },

    // username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Doctor", doctorSchema);
