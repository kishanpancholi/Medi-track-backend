import express from "express";
import { registerDoctor, loginDoctor } from "../controllers/doctorController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerDoctor);
router.post("/login",loginDoctor);

router.get("/profile", protect, async (req, res) => {
   const user = await Patient.findById(req.user).select("-password");
   res.json(user);
});

export default router;