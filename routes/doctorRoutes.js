import express from "express";
import { registerDoctor, loginDoctor, getAllDoctors, logoutDoctor, completeDoctorProfile } from "../controllers/doctorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.post("/register", registerDoctor);
router.post("/login",loginDoctor);
router.post("/logout",logoutDoctor);
router.post("/complete-profile", protect,authorize("doctor"),completeDoctorProfile
);

router.get("/book", getAllDoctors);

// router.get("/profile", protect, async (req, res) => {
//    const user = await Patient.findById(req.user).select("-password");
//    res.json(user);
// });
router.get("/profile", protect, authorize("doctor"),(req, res) => {
  res.status(200).json({
    message: "Doctor Authorized",
    user: req.user,
  });
});

export default router;