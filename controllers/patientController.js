import Patient from "../models/Patient.js";

export const registerPatient = async (req, res) => {
  try {
    const {
      fname,
      lname,
      gender,
      dob,
      mobile,
      email,
      address,
      password,
      confirmPassword,
    } = req.body;

    const exists = await Patient.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const patient = await Patient.create({
      fname,
      lname,
      gender,
      dob,
      mobile,
      email,
      address,
      password,
      confirmPassword,
    });

    res.status(201).json({ msg: "Patient registered successfully!", patient });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
};
