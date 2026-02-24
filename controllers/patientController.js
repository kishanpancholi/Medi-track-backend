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

//patient login 
export const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Patient.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Email not registered" });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    res.status(200).json({
      message: "Login Successful",
      user,
    });

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};