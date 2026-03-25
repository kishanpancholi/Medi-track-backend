import express from "express";
import { createAppointment } from "../controllers/appointmentController.js";

const router = express.Router();

router.post("/", createAppointment); // POST /api/appointments

export default router;