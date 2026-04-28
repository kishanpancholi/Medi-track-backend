// import express from "express";
// import {
//   createRecord,
//   getPatientRecords,
//   getRecordById,
//   deleteRecord,
// } from "../controllers/medicalRecordController.js";

// const router = express.Router();

// router.post("/", createRecord);
// router.get("/patient/:patientId", getPatientRecords);
// router.get("/:id", getRecordById);
// router.delete("/:id", deleteRecord);

// export default router;

import express from "express";
import {
  createRecord,
  getPatientRecords,
  getRecordById,
  deleteRecord,getDoctorPatients,
} from "../controllers/medicalRecordController.js";

import { upload } from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Create record (with file upload)
// router.post("/", protect, upload.single("file"), createRecord);
// router.post("/upload", protect, upload.single("file"), createRecord);

// // ✅ Get all records of a patient
// router.get("/patient/:patientId", protect, getPatientRecords);

// // ✅ Get single record
// router.get("/:id", protect, getRecordById);

// // ✅ Delete record
// router.delete("/deleteRecord/:id", protect, deleteRecord);

// // load patient names in dropdown on doctor side medical records page 
// router.get("/patients", protect, getDoctorPatients);

// ✅ Create record
router.post("/upload", protect, upload.single("file"), createRecord);

// ✅ Get all records of a patient
router.get("/patient/:patientId", protect, getPatientRecords);
// ✅ 🔥 MOVE THIS UP
router.get("/patients", protect, getDoctorPatients);

// ❌ KEEP THESE BELOW
router.get("/:id", protect, getRecordById);
router.delete("/deleteRecord/:id", protect, deleteRecord);
export default router;