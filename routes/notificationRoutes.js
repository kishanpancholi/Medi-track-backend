import express from "express";
import {
  getNotifications,
  markAsRead,getUnreadCount,sendAdminNotification,getAdminNotifications,deleteNotification
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

// ✅ ADMIN → SEND NOTIFICATION
router.post("/sendAdminNotification", protect, sendAdminNotification);

// ✅ ADMIN → GET NOTIFICATIONS
router.get("/admin-notifications", protect, getAdminNotifications);

// ✅ ADMIN → DELETE NOTIFICATION
// router.delete("/admin-notifications/:id", protect, deleteNotification);
router.delete("/delete/:id", protect, deleteNotification);

export default router;