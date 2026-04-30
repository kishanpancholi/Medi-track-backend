import express from "express";
import {
  registerPatient,
  loginPatient,
  completePatientProfile,
  getPatients,
  getPatientProfile,
  updatePatientProfile,
  deletePatient,
  logoutPatient,
  sendOtp,
  verifyOtp,
  resetPassword,
} from "../controllers/patientController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

//Register & Login
router.post("/register", registerPatient);
router.post("/login", loginPatient);
// Complete-Profile  
router.put("/complete-profile", protect, authorize("patient"), completePatientProfile);
router.get("/get-profile", protect, authorize("patient"), getPatientProfile);
router.put("/update-profile", protect, authorize("patient"), updatePatientProfile);

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/logout", logoutPatient);

router.get("/profile", protect, authorize("patient"), (req, res) => {
  res.status(200).json({
    message: "Patient Authorized",
    user: req.user,
  });
});

// Patient List APIs
router.get("/list", getPatients); // GET all patients in admin side in patient page
router.delete("/:id", deletePatient); // DELETE patient

export default router;