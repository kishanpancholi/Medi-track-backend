import express from "express";
import { createAppointment, getDoctorAppointments, updateAppointmentStatus } from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", createAppointment); // POST /api/appointments
router.get("/doctor", protect, getDoctorAppointments); // get doctor appointment
router.put("/:id", protect, updateAppointmentStatus); // update status put

export default router;