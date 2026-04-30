import Notification from "../models/Notification.js";
import { notificationMessages } from "../utils/notificationMessages.js";

// 📥 GET ALL NOTIFICATIONS (for logged-in user)
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// ✅ MARK AS READ
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.findByIdAndUpdate(id, {
      isRead: true,
    });

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating notification" });
  }
};
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching count" });
  }
};