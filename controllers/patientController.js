import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerPatient = async (req, res) => {
  try {
    const { firstName, lastName, gender, dob, mobile, email, address, password } =
      req.body;

    const exists = await Patient.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Email Already Registered" });
    }

    //hash password
    const salt = await bcrypt.genSalt(10); // salt is use for aading the random string before the hashing It makes every password hash unique even two user use same password
    const hashedPassword = await bcrypt.hash(password, salt); // it is conver the plain password into the secure hashing password

    const patient = await Patient.create({
      firstName,
      lastName,
      gender,
      dob,
      mobile,
      email,
      address,
      password: hashedPassword, // this is use for storing the hase password in DB
    });

    res.status(201).json({ msg: "Patient Registered Successfully!", patient });
  } catch (error) {
    res.status(500).json({ msg: "SERVER ERROR", error });
  }
};

//patient login
export const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Patient.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Email Not Registered" });
    }

    const isMatch = await bcrypt.compare(password, user.password); // in here bcypt takes enter password hash that password again and match that password with stored hash password in DB if match then continue otherwise give
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password" });
    }
    // if (user.password !== password) {
    //   return res.status(400).json({ message: "Incorrect Password" });
    // }

    // After login we create token:
    const token = jwt.sign(
      { id: user._id, role:"patient"},
      process.env.JWT_SECRET,//JWT secrat key and Digitally sign the token
      { expiresIn: "1d" },
    );

    res
    .cookie("patientToken", token,{
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60* 1000,// cookie valid for the 1 day
    })
    
    .status(200).json({
      message: "Login Successful",
      token,
      user,
    });
  } catch (err) {
    console.log("error",err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Add Patient Count
export const getPatientCount = async (req, res) => {
   try {
      const totalPatients = await Patient.countDocuments();
      res.json({ totalPatients });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// 🔹 Helper function to calculate age from DOB
const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// 🔹 GET ALL PATIENTS (for Patient List page)
export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });

    // format data for frontend
    const formattedPatients = patients.map((p) => ({
      _id: p._id,
      name: `${p.firstName} ${p.lastName}`,
      age: calculateAge(p.dob),
      gender: p.gender,
      phone: p.mobile,
      email: p.email,
      address: p.address,
      createdAt: p.createdAt,
    }));

    res.json(formattedPatients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 DELETE PATIENT
export const deletePatient = async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutPatient = (req, res) => {
  res.clearCookie("patientToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true in production
  });

  res.status(200).json({ message: "Logout successful" });
};
