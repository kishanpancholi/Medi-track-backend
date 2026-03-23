import express from "express";
import { registerDoctor, loginDoctor, logoutDoctor } from "../controllers/doctorController.js";
import { protectDoctor} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerDoctor);
router.post("/login",loginDoctor);
router.post("/logout",logoutDoctor);

// router.get("/profile", protect, async (req, res) => {
//    const user = await Patient.findById(req.user).select("-password");
//    res.json(user);
// });
router.get("/profile", protectDoctor,(req, res) => {
  res.status(200).json({
    message: "Doctor Authorized",
    user: req.user,
  });
});

export default router;