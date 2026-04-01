import Admin from "../models/Admin.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 3. Generate token
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 4. Send token (cookie or response)
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // true in production
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(200).json({
      message: "Login successful",
      admin: {
        id: admin._id,
        email: admin.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutAdmin = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    // sameSite: "lax",
    // secure: false, // true in production
    expires: new Date(0)
  });

  res.status(200).json({ message: "Logout successful" });
};

// Get all doctors (Admin)
/* export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().select("-password");

    res.status(200).json({
      success: true,
      totalDoctors: doctors.length,
      doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
      error: error.message,
    });
  }
}; */