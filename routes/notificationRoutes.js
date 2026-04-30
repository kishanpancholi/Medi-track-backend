import express from "express";
import {
  getNotifications,
  markAsRead,
} from "../controllers/notificationController.js";

// ✅ USE YOUR EXISTING MIDDLEWARE
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 📥 GET notifications
router.get("/getnotifications", protect, getNotifications);

// ✅ mark as read
router.put("/:id/read", protect, markAsRead);

export default router;