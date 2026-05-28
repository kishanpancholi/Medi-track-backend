import express from "express";
import { createAppointment, 
        getMeetingDetails,
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
        getAppointmentRequests,
        getMyDoctors,
        getNextPatient,
        getAppointmentOverview,
        getAppointmentStatusStats,
        getDoctorPerformance,
        getPatientBehavior,
        getSystemGrowth} from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";
import checkDoctorActive from "../middleware/checkDoctorActive.js";
const router = express.Router();

router.post("/", protect, createAppointment); // POST /api/appointments
router.get("/meeting/:appointmentId", protect, getMeetingDetails); // get meeting detail for video call appointments
router.get("/doctor", protect, authorize("doctor"),getDoctorAppointments); // get doctor appointment
router.put("/:id", protect, authorize("doctor"), checkDoctorActive, updateAppointmentStatus); // update status
router.get("/all", protect, getAllAppointments);// to get all appointments on admin side
router.get("/booked-slot", getBookedSlots)
router.get("/slots", getAvailableSlots);
router.get("/today", protect, getTodayAppointments);
router.get("/requests", protect,authorize("doctor"), getAppointmentRequests);
router.put("/complete/:id", protect,  authorize("doctor"), checkDoctorActive,completeAppointment);
router.put("/:appointmentId/cancel", protect, authorize("patient"), cancelAppointment); // to cancel appointments by patients
router.put("/:appointmentId/reschedule", protect, authorize("patient"), rescheduleAppointment); // to reschedule appointments by patients
router.get("/dashboard", protect, authorize("doctor"),getDoctorDashboard); // to get count on doctor side
router.get("/mydoctors", protect, getMyDoctors);
router.get("/next", protect, authorize("doctor"),getNextPatient); // get next patient on doctor dashboard 
router.get("/overview", protect,getAppointmentOverview); // admin side appointment overview chart data
router.get("/status-stats", protect, getAppointmentStatusStats); // admin side appointment status pie chart data
router.get("/performance", protect, getDoctorPerformance); // admin side doctor performance analysis
router.get("/behavior", protect, getPatientBehavior); // admin side patient behavior analysis
router.get("/growth", protect, getSystemGrowth); // admin side system growth metrics
export default router;