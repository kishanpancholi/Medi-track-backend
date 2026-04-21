import express from "express";
import { createAppointment, 
        getDoctorAppointments, 
        getTodayAppointments,
        completeAppointment,
        updateAppointmentStatus, 
        getAllAppointments, 
        cancelAppointment,
        rescheduleAppointment,
        getDoctorDashboard,
        getAvailableSlots,
        getBookedSlots,
        getAppointmentRequests} from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.post("/", createAppointment); // POST /api/appointments
router.get("/doctor", protect, getDoctorAppointments); // get doctor appointment
router.put("/:id", protect, updateAppointmentStatus); // update status /put
router.get("/all", protect, getAllAppointments);// to get all appointments on admin side
router.get("/booked-slot", getBookedSlots)
router.get("/slots", getAvailableSlots);
router.get("/today", protect, getTodayAppointments);
router.get("/requests", protect, getAppointmentRequests);
router.put("/complete/:id", protect, completeAppointment);
router.put("/:appointmentId/cancel", protect, authorize("patient"), cancelAppointment); // to cancel appointments by patients
router.put("/:appointmentId/reschedule", protect, authorize("patient"), rescheduleAppointment); // to reschedule appointments by patients
router.get("/dashboard", protect, getDoctorDashboard); // to get count on doctor side
export default router;