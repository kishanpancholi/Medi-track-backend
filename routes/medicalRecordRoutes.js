import express from "express";
import {
  createRecord,
  getPatientRecords,
  getRecordById,
  deleteRecord,
} from "../controllers/medicalRecordController.js";

const router = express.Router();

router.post("/", createRecord);
router.get("/patient/:patientId", getPatientRecords);
router.get("/:id", getRecordById);
router.delete("/:id", deleteRecord);

export default router;