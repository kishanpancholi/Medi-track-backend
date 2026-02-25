import express from "express";
import Doctor from "../models/Doctor.js";

const router = express.Router();

// Register Doctor
router.post("/register", async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();

    res.json({ message: "Doctor registered successfully", doctor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;