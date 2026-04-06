import express from "express";
import {
  registerDoctor,
  loginDoctor,
  getDoctorNames,
  logoutDoctor,
  completeDoctorProfile,
  getAllDoctor,
  updateDoctorStatus,
} from "../controllers/doctorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.post("/register", registerDoctor);
router.post("/login", loginDoctor);
router.post("/logout", logoutDoctor);
router.post("/complete-profile",protect,authorize("doctor"),completeDoctorProfile,);

router.get("/names", getDoctorNames); // get all doctors in dropdown
router.get("/all", getAllDoctor); // get all doctor in admin side doc page
router.put("/:doctorId/status", protect, authorize("admin"), updateDoctorStatus); // doctor approve or reject by admin 

router.get("/profile", protect, authorize("doctor"), (req, res) => {
  res.status(200).json({
    message: "Doctor Authorized",
    user: req.user,
  });
});

export default router;