import express from "express";
import { createAppointment, getDoctorAppointments } from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", createAppointment); // POST /api/appointments
router.get("/doctor", protect, getDoctorAppointments);

export default router;