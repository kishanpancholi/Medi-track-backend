import express from "express";
import {
  createRecord,
  getPatientRecords,
  getRecordById,
  deleteRecord,
  getDoctorPatients,
  getMyRecords,
  generateSummary,
} from "../controllers/medicalRecordController.js";

import { upload } from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create record
router.post("/upload", protect, upload.single("file"), createRecord);

router.get("/my", protect, getMyRecords); //patient
// Get all records of a patient
router.get("/patient/:patientId", protect, getPatientRecords);
// MOVE THIS UP
router.get("/patients", protect, getDoctorPatients);

// KEEP THESE BELOW
router.get("/:id", protect, getRecordById);

router.delete("/deleteRecord/:id", protect, deleteRecord);

router.post("/generate-summary/:recordId", protect, generateSummary);
export default router;