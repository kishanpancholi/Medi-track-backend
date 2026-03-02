import express from "express";
import { registerPatient, loginPatient } from "../controllers/patientController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerPatient);
router.post("/login",loginPatient); 

router.get("/profile", protect, async (req, res) => {
   const user = await Patient.findById(req.user).select("-password");
   res.json(user);
});

export default router;  