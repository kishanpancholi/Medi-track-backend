import express from "express";
import {
  registerPatient,
  loginPatient,
  getPatientCount,
  getPatients,
  getTodayPatients,
  deletePatient,
  logoutPatient,
} from "../controllers/patientController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";
import Patient from "../models/Patient.js";

const router = express.Router();

//Register & Login
router.post("/register", registerPatient);
router.post("/login", loginPatient);
router.post("/logout", logoutPatient);

//Profile
// router.get("/profile", protect, async (req, res) => {
//    const user = await Patient.findById(req.user).select("-password");
//    res.json(user);
// });

router.get("/profile", protect, authorize("patient"), (req, res) => {
  res.status(200).json({
    message: "Patient Authorized",
    user: req.user,
  });
});

// Add count
router.get("/count", getPatientCount);
router.get("/today", getTodayPatients);

// Patient List APIs
router.get("/list", getPatients); // GET all patients
router.delete("/:id", deletePatient); // DELETE patient

export default router;