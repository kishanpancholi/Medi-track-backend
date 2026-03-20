import express from "express";
import { registerPatient, loginPatient} from "../controllers/patientController.js";
import { protect } from "../middleware/authMiddleware.js";
import Patient from "../models/Patient.js";

const router = express.Router();

//Register & Login
router.post("/register", registerPatient);
router.post("/login", loginPatient);

//Profile
router.get("/profile", protect, async (req, res) => {
   const user = await Patient.findById(req.user).select("-password");
   res.json(user);
});

//Add Count
router.get("/count", async (req, res) => {
   try {
      const totalPatients = await Patient.countDocuments();
      res.json({ totalPatients });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

export default router;  