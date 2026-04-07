import express from "express";
import { createAppointment, 
        getDoctorAppointments, 
        updateAppointmentStatus, 
        getAllAppointments, 
        cancelAppointment,
        rescheduleAppointment,
        getDoctorDashboard} from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.post("/", createAppointment); // POST /api/appointments
router.get("/doctor", protect, getDoctorAppointments); // get doctor appointment
router.put("/:id", protect, updateAppointmentStatus); // update status /put
router.get("/all", protect, getAllAppointments);// to get all appointments on admin side

router.put("/:appointmentId/cancel", protect, authorize("patient"), cancelAppointment); // to cancel appointments by patients
router.put("/:appointmentId/reschedule", protect, authorize("patient"), rescheduleAppointment); // to reschedule appointments by patients
router.get("/dashboard", protect, getDoctorDashboard); // to get count on doctor side
export default router;