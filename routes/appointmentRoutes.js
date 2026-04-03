import express from "express";
import { createAppointment, getDoctorAppointments, updateAppointmentStatus, getAllAppointments, getDoctorDashboard} from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", createAppointment); // POST /api/appointments
router.get("/doctor", protect, getDoctorAppointments); // get doctor appointment
router.put("/:id", protect, updateAppointmentStatus); // update status /put
router.get("/all", protect, getAllAppointments);// to get all appointments on admin side
router.get("/dashboard", protect, getDoctorDashboard); // to get count on doctor side
export default router;