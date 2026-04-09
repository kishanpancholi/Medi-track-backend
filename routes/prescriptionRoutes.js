import express from "express";
import {
  createPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getSinglePrescription,
  updatePrescription,
  updateMedicineStatus,
  updatePrescriptionStatus,
  deletePrescription,
} from "../controllers/prescriptionController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

// Doctor adds prescription
router.post("/createPres", protect, authorize("doctor"), createPrescription);

// Patient views prescription
router.get("/patient", protect, authorize("patient"), getPatientPrescriptions);

// Doctor gets own prescriptions
router.get("/doctor", protect, authorize("doctor"), getDoctorPrescriptions);

// Get single prescription
router.get("/:id", protect, getSinglePrescription);

// Update prescription
router.put("/:id", protect, authorize("doctor"), updatePrescription);

// Update medicine status
router.put("/:prescriptionId/medicine/:medicineId", protect, updateMedicineStatus);

// Update prescription status
router.put("/:id/status", protect, updatePrescriptionStatus);

// Delete prescription
router.delete("/:id", protect, authorize("doctor"), deletePrescription);

export default router;