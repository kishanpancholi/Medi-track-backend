import Doctor from "../models/Doctor.js";

const checkDoctorActive = async (req, res, next) => {
  try {
    const doctorId = req.user.id; // ✅ FIXED

    const doctor = await Doctor.findById(doctorId); // ✅ direct lookup

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended. You cannot perform this action.",
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export default checkDoctorActive;