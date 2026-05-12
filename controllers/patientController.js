import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpService, verifyOtpService, resetPasswordService } from "../utils/forgotPassword.js";
import { sendNotification } from "../utils/sendNotification.js";
import { notificationMessages } from "../utils/notificationMessages.js";

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

    await sendNotification({
      title: "New Patient Registered",
      message: `${firstName} ${lastName} has registered.`,
      role: "Admin", // 👈 VERY IMPORTANT
      type: "patient_registered", 
    });
    res.status(201).json({ msg: "Patient Registered Successfully!", patient });

  } catch (error) {
    res.status(400).json({ msg: error.message });
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
      { id: user._id, role: "patient" },
      process.env.JWT_SECRET,//JWT secrat key and Digitally sign the token
      { expiresIn: "1d" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,// cookie valid for the 1 day
    })

    // .status(200).json({
    //   message: "Login Successful",
    //   token,
    //   user,
    // });
    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        ...user._doc,
        role: "Patient", // 🔥 ADD THIS LINE
      },
    });
  } catch (err) {
    console.log("error", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const completePatientProfile = async (req, res) => {
  try {
    const patientId = req.user.id;

    // Find existing patient
    const existingPatient = await Patient.findById(patientId);

    if (!existingPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const {
      city,
      state,
      pincode,
      bloodGroup,
      allergies,
      diseases,
      medications,
      weight,
      emergencyContact,
    } = req.body;

    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      {
        // Old registered data remains same
        firstName: existingPatient.firstName,
        lastName: existingPatient.lastName,
        gender: existingPatient.gender,
        dob: existingPatient.dob,
        mobile: existingPatient.mobile,
        email: existingPatient.email,
        address: existingPatient.address,

        // New profile completion data
        city,
        state,
        pincode,
        bloodGroup,
        allergies,
        diseases,
        medications,
        weight,
        emergencyContact,
        isProfileComplete: true,
      },
      {
        new: true, // returns updated document not old one
        runValidators: true // it make sure that schema validations are applied during update
      }
    ).select("-password");

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({
      message: "Profile completed successfully",
      patient: updatedPatient,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate age from DOB
const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// GET ALL PATIENTS (for Patient List page)
// export const getPatients = async (req, res) => {
//   try {
//     const patients = await Patient.find()
//        .select("-password")
//       .sort({ createdAt: -1 });

//     res.json(patients);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .select("-password")
      .sort({ createdAt: -1 });

    // format data for frontend
    const formattedPatients = patients.map((p) => ({
      _id: p._id,

      // Full Name
      name: `${p.firstName} ${p.lastName}`,

      // Calculate Age
      age: calculateAge(p.dob),

      // Other Fields
      gender: p.gender,
      phone: p.mobile,
      email: p.email,
      address: p.address,
      city: p.city,
      createdAt: p.createdAt,
    }));

    res.json(formattedPatients);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE PATIENT
export const deletePatient = async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/", // VERY IMPORTANT
};

export const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select("-password");

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({
      message: "Patient Profile Fetched",
      user: patient,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePatientProfile = async (req, res) => {
  try {
    const updated = await Patient.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ patient: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const sendOtp = async (req, res) => {
  try {
    await sendOtpService(Patient, req.body.email);
    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    await verifyOtpService(Patient, email, otp);

    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    await resetPasswordService(Patient, email, otp, password);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const logoutPatient = (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.status(200).json({ message: "Logout successful" });
};