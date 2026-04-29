import Doctor from "../models/Doctor.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Appointment from "../models/Appointment.js";
import { sendOtpService, verifyOtpService, resetPasswordService } from "../utils/forgotPassword.js";

export const registerDoctor = async (req, res) => {
  try {
    // console.log("Doctor Form Data:", req.body);//this line is printing the submitted data in terminal 
    const {
      fullName,
      email,
      password,
      specialization,
      qualification,
      mobile,
      experience,
      licenseNumber,
    } = req.body;
    const exists = await Doctor.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const doctor = await Doctor.create({
      fullName,
      email,
      password: hashedPassword,
      specialization,
      qualification,
      mobile,
      experience,
      licenseNumber,
    });

    res.status(201).json({ msg: "Doctor registered successfully!", doctor });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

//Doctor login 
export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const doc = await Doctor.findOne({ email });

    if (!doc) {
      return res.status(400).json({ message: "Email Not Registerd" });
    }

    // if admin will not approved it will show this msg to doctor
    /* if (doc.status !== "approved") {
      return res.status(403).json({
        message: "Your account is not approved yet",
      });
    } */

    const isMatch = await bcrypt.compare(password, doc.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    //create a json token
    const token = jwt.sign(
      { id: doc._id, role: "doctor" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    //STORE TOKEN IN COOKIE
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // true in production (HTTPS)
      path: "/",
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      message: "Login Successful",
      doc,
      token,
      doctor: {
        id: doc._id,
        fullName: doc.fullName,
        email: doc.email,
        isProfileComplete: doc.isProfileComplete,
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get all doctors (only name + id) get all doctors in dropdown
export const getDoctorNames = async (req, res) => {
  try {
    const doctors = await Doctor.find({
      status: "approved",
      isProfileComplete: true,
    }).select("fullName specialization serviceType");

    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: error.message });
  }
};

export const completeDoctorProfile = async (req, res) => {
  try {

    // ✅ check auth
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const doctorId = req.user.id;

    const {
      fullName,
      gender,
      dob,
      specialization,
      qualification,
      mobile,
      experience,
      licenseNumber,
      workingDays,
      workingHours,
      clinicName,
      clinicAddress,
      city,
      state,
      mapLink,
      about,
      emergencyContact,
      serviceType,
    } = req.body;

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      {
        fullName,
        gender,
        dob,
        specialization,
        qualification,
        mobile,
        experience,
        licenseNumber,
        workingDays,
        workingHours,
        clinicName,
        clinicAddress,
        city,
        state,
        mapLink,
        about,
        emergencyContact,
        serviceType,
        isProfileComplete: true,
      },
      {
        new: true, // returns updated document not old one
        runValidators: true // it make sure that schema validations are applied during update
      }
    );

    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get all doctors on admin side
export const getAllDoctor = async (req, res) => {
  try {
    // Fetch all doctors (you can sort if needed)
    const doctors = await Doctor.find().sort({ createdAt: -1 });

    // Send response
    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });

  } catch (error) {
    console.error("Error fetching doctors:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
    });
  }
};

// Admin approves or rejects doctor
export const updateDoctorStatus = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status } = req.body; // "approved" or "rejected"

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { status },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({
      message: `Doctor ${status} successfully`,
      doctor,
    });

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


//show male & female chart in doctor dashboard
export const getGender = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized - No user" });
    }
    
    const doctorId = req.user.id;
    
    const appointments = await Appointment.find({
      doctor: doctorId, // removed ObjectId conversion (safer)
    }).populate("patient", "gender");
    
    const uniquePatients = new Map();
    appointments.forEach((appt) => {
      if (appt.patient) {
        uniquePatients.set(appt.patient._id.toString(), appt.patient);
      }
    });

    let male = 0;
    let female = 0;

    uniquePatients.forEach((patient) => {
      const gender = patient.gender?.toLowerCase();

      if (gender === "male") male++;
      if (gender === "female") female++;
    });
    
    res.status(200).json({ male, female });

  } catch (error) {
    console.log("Gender API Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// to update doctor profile
export const getDoctorProfileFull = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doctor = await Doctor.findById(req.user.id).select("-password");
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    
    res.status(200).json({
      success: true,
      user: doctor,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendOtpDoctor = async (req, res) => {
  try {
    await sendOtpService(Doctor, req.body.email);
    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const verifyOtpDoctor = async (req, res) => {
  try {
    const { email, otp } = req.body;

    await verifyOtpService(Doctor, email, otp);

    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const resetPasswordDoctor = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    await resetPasswordService(Doctor, email, otp, password);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const logoutDoctor = (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.status(200).json({ message: "Logout successful" });
};