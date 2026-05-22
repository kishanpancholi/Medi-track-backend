import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Appointment from "../models/Appointment.js";
import {
  sendOtpService,
  verifyOtpService,
  resetPasswordService,
} from "../utils/forgotPassword.js";
import { sendNotification } from "../utils/sendNotification.js";

export const registerDoctor = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      specialization,
      qualification,
      mobile,
      experience,
      licenseNumber,
      gender,
      dob,
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
      gender,
      dob,
    });
    await sendNotification({
      title: "New Doctor Registered",
      message: `${fullName} has registered as a doctor.`,
      role: "Admin",
      type: "doctor_registered",
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
      secure: true,
      path: "/",
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    await sendNotification({
      title: "Doctor Login",
      message: `${doc.fullName} just logged in`,
      role: "Admin",
      type: "doctor_login",
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
      },
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
    // check auth
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
        runValidators: true, // it make sure that schema validations are applied during update
      },
    );

    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    await sendNotification({
      title: "Doctor Profile Completed",
      message: `${updatedDoctor.fullName} completed their profile.`,
      role: "Admin",
      type: "doctor_profile_completed",
    });
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

    // Dynamic Specializations
    const specializations = [
      ...new Set(doctors.map((doc) => doc.specialization).filter(Boolean)),
    ];

    // Experience Dropdown
    const experienceRanges = [
      {
        label: "0 - 5 Years",
        value: "0-5",
      },
      {
        label: "6 - 10 Years",
        value: "6-10",
      },
      {
        label: "10+ Years",
        value: "10+",
      },
    ];

    // Status Dropdown
    const statuses = [
      ...new Set(doctors.map((doc) => doc.status).filter(Boolean)),
    ];

    // Send response
    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,

      filters: {
        specializations,
        experienceRanges,
        statuses,
      },
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
      { new: true },
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    await sendNotification({
      title: `Doctor ${status}`,
      message: `Dr. ${doctor.fullName} has been ${status}.`,
      role: "Admin",
      type: "doctor_status_updated",
    });
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
  path: "/",
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

export const getFilteredDoctors = async (req, res) => {
  try {
    const { specialization, serviceType, experience, rating, availability } =
      req.query;

    let query = {
      status: "approved",
      isProfileComplete: true,
    };

    if (specialization) {
      query.specialization = {
        $regex: specialization,
        $options: "i",
      };
    }

    if (serviceType) {
      query.serviceType = {
        $regex: new RegExp(`^${serviceType}$`, "i"),
      };
    }

    if (experience) {
      if (experience === "0-5") {
        query.experience = { $gte: 0, $lte: 5 };
      } else if (experience === "5-10") {
        query.experience = { $gt: 5, $lte: 10 };
      } else if (experience === "10+") {
        query.experience = { $gt: 10 };
      }
    }

    if (availability) {
      query.workingDays = {
        $elemMatch: {
          $regex: new RegExp(`^${availability}$`, "i"),
        },
      };
    }

    if (rating) {
      query.averageRating = { $gte: Number(rating) };
    }

    let doctors = await Doctor.find(query);

    res.status(200).json(doctors);
  } catch (error) {
    console.error("Filter error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// the dynamic dropdown values for specialization, service type and availability for patient home page filters section
export const getFilterOptions = async (req, res) => {
  try {
    const doctors = await Doctor.find({
      status: "approved",
      isProfileComplete: true,
    });

    const specializations = [...new Set(doctors.map((d) => d.specialization))];
    const serviceTypes = [...new Set(doctors.map((d) => d.serviceType))];

    const availability = [
      ...new Set(doctors.flatMap((d) => d.workingDays || [])),
    ];

    res.status(200).json({
      specializations,
      serviceTypes,
      availability,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load filters" });
  }
};
// export const suspendDoctor = async (req, res) => {
//   try {
//     const { doctorId, reason } = req.body;

//     const doctor = await Doctor.findByIdAndUpdate(
//       doctorId,
//       {
//         status: "suspended",
//         suspensionReason: reason || "Not specified",
//       },
//       { new: true }
//     );

//     res.json({
//       success: true,
//       message: "Doctor suspended",
//       doctor,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


export const suspendDoctor = async (req, res) => {
  try {
    const { doctorId, reason } = req.body;

    // 1️⃣ Suspend doctor
    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      {
        status: "suspended",
        suspensionReason: reason || "",
      },
      { new: true }
    );

    // 2️⃣ 🔔 GLOBAL NOTIFICATION TO ALL PATIENTS
    const allPatients = await Patient.find();
    for (let patient of allPatients) {
      await sendNotification({
        userId: patient._id,
        role: "Patient",
        type: "doctor_suspended",
        title: "Doctor Unavailable",
        message: `Dr. ${doctor.fullName} has been suspended and is currently not available.`,
      });
    }

    // 3️⃣ Find affected appointments
    const now = new Date();

    const appointments = await Appointment.find({
      doctor: doctorId,
      status: { $in: ["pending", "confirmed"] },
      date: { $gte: now },
    });

    // 4️⃣ Reject + notify ONLY those patients
    for (let appt of appointments) {
      appt.status = "rejected";
      appt.rejectionReason = "Doctor suspended by admin";
      await appt.save();
      // Format Date
const formattedDate = new Date(appt.date).toDateString();
const formattedTime = appt.time;
      await sendNotification({
        userId: appt.patient,
        role: "Patient",
        type: "appointment_rejected",
        title: "Appointment Cancelled",
message: `Your appointment with Dr. ${doctor.fullName} on ${formattedDate} at ${formattedTime} has been cancelled because the doctor is suspended.`,      });
    }

    return res.json({
      success: true,
      message: "Doctor suspended + notifications sent",
    });
  } 
  catch (err) {
  console.error("🔥 Suspend Doctor Error:", err);

  res.status(500).json({
    success: false,
    message: err.message, // 👈 THIS WILL SHOW REAL ERROR
  });
}
};

export const activateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;

    // 1️⃣ Activate doctor
    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      {
        status: "approved",
        suspensionReason: "",
      },
      { new: true }
    );

    // 2️⃣ 🔔 NOTIFY ALL PATIENTS
    const allPatients = await Patient.find();

    for (let patient of allPatients) {
      await sendNotification({
        userId: patient._id,
        role: "Patient",
        type: "doctor_activated", // ⚠️ IMPORTANT (see below)
        title: "Doctor Available",
        message: `Dr. ${doctor.fullName} is now active and available Book Your appointments.`,
      });
    }

    // 3️⃣ RESPONSE
    res.json({
      success: true,
      message: "Doctor activated + notifications sent",
      doctor,
    });

  } catch (err) {
    console.error("🔥 Activate Doctor Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// export const activateDoctor = async (req, res) => {
//   try {
//     const { doctorId } = req.body;

//     const doctor = await Doctor.findByIdAndUpdate(
//       doctorId,
//       {
//         status: "approved",
//         suspensionReason: "",
//       },
//       { new: true }
//     );

//     res.json({
//       success: true,
//       message: "Doctor activated",
//       doctor,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };