import express from "express";
import {
  createPrescription,
  getPatientPrescriptions,
} from "../controllers/prescriptionController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

// Doctor adds prescription
router.post("/createPres", protect, authorize("doctor"), createPrescription);

// Patient views prescription
router.get("/patient", protect, authorize("patient"), getPatientPrescriptions);

export default router;