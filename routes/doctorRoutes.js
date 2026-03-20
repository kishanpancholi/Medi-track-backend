import express from "express";
import { registerDoctor, loginDoctor, logoutDoctor } from "../controllers/doctorController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerDoctor);
router.post("/login",loginDoctor);
router.post("/logout",logoutDoctor);

// router.get("/profile", protect, async (req, res) => {
//    const user = await Patient.findById(req.user).select("-password");
//    res.json(user);
// });
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    message: "Authorized",
    user: req.user,
  });
});

export default router;