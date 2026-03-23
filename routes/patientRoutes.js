import express from "express";
import { registerPatient, loginPatient, getPatientCount, getPatients, deletePatient, logoutPatient} from "../controllers/patientController.js";
import { protectPatient } from "../middleware/authMiddleware.js";
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

router.get("/profile", protectPatient, (req, res) => {
  res.status(200).json({
    message: "Patient Authorized",
    user: req.user,
  });
});

// Add count
router.get("/count", getPatientCount);

// Patient List APIs
router.get("/", getPatients);          // GET all patients
router.delete("/:id", deletePatient); // DELETE patient

export default router;  