import Doctor from "../models/Doctor.js";

export const registerDoctor = async (req, res) => {
  try {
    console.log("Doctor Form Data:", req.body);
    const {
      fullName,
      gender,
      dob,
      specialization,
      qualification,
      mobile,
      email,
      address,
      username,
      password,
    } = req.body;
    const exists = await Doctor.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const doctor = await Doctor.create({
      fullName,
      gender,
      dob,
      specialization,
      qualification,
      mobile,
      email,
      address,
      username,
      password,
    });

    res.status(201).json({ msg: "Doctor registered successfully!", doctor });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
