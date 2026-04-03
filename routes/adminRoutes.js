import express from "express";
import { adminLogin, getDashboardData ,logoutAdmin } from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/logout",logoutAdmin);

router.get("/dashboard",protect,authorize("admin"), getDashboardData);

export default router;