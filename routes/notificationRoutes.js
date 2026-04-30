import express from "express";
import {
  getNotifications,
  markAsRead,getUnreadCount
} from "../controllers/notificationController.js";

// ✅ USE YOUR EXISTING MIDDLEWARE
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 📥 GET notifications
router.get("/getnotifications", protect, getNotifications);

// ✅ mark as read
router.put("/:id/read", protect, markAsRead);
//  GET unread count
router.get("/unread-count", protect, getUnreadCount);

export default router;