import Notification from "../models/Notification.js";
import { notificationMessages } from "../utils/notificationMessages.js";
import { sendNotification } from "../utils/sendNotification.js";
import Admin from "../models/Admin.js";
import mongoose from "mongoose";

// ✅ MARK AS READ

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const role = req.user.role;

    // ✅ Normalize role (match DB format)
    const formattedRole =
      role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    const notifications = await Notification.find({
      $or: [
        { userId: userId },
        { type: "admin_message", role: formattedRole },
        { type: "admin_message", role: "ALL" } 
      ],
      "deletedBy.userId": { $ne: userId },
    }).sort({ createdAt: -1 });

    res.json(notifications);

  } catch (error) {
    console.log("❌ ERROR:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};


export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id: userId, role } = req.user;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Not found" });
    }

    // 🔒 SECURITY CHECK
    if (
      notification.userId?.toString() !== userId.toString() &&
      notification.role !== role &&
      notification.role !== "ALL"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Marked as read" });

  } catch (error) {
    res.status(500).json({ message: "Error updating" });
  }
};

// export const markAsRead = async (req, res) => {
//   try {
//     const { id } = req.params;

//     await Notification.findByIdAndUpdate(id, {
//       isRead: true,
//     });

//     res.json({ message: "Notification marked as read" });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Error updating notification" });
//   }
// };
// export const getUnreadCount = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     const count = await Notification.countDocuments({
//       userId,
//       isRead: false,
//     });

//     res.json({ count });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching count" });
//   }
// };


export const getUnreadCount = async (req, res) => {
  try {
    const { _id: userId, role } = req.user;

    const count = await Notification.countDocuments({
      isRead: false,
      $or: [
        { userId },
        { role },
        { role: "ALL" }
      ]
    });

    res.json({ count });

  } catch (error) {
    res.status(500).json({ message: "Error fetching count" });
  }
};
export const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      type: "admin_message"
    }).sort({ createdAt: -1 });

    res.json(notifications);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching admin notifications" });
  }
};

export const sendAdminNotification = async (req, res) => {
  try {
    const { target, message } = req.body;

    if (!target || !message) {
      return res.status(400).json({
        message: "Missing target or message",
      });
    }

    let notificationData = {
      type: "admin_message",
      message,
    };

    // 🎯 CASE 1: ALL USERS
    if (target === "ALL") {
      notificationData.role = "ALL";

      const notification = await Notification.create(notificationData);

      io.to("ALL_USERS").emit("newNotification", notification);

      return res.json({ success: true, data: notification });
    }

    // 🎯 CASE 2: Role-based
    notificationData.role = target;

    const notification = await Notification.create(notificationData);

    io.to(target).emit("newNotification", notification);

    return res.json({ success: true, data: notification });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


// export const sendAdminNotification = async (req, res) => {
//   try {
//     const { target, message } = req.body;

//     if (!target || !message) {
//       return res.status(400).json({
//         message: "Missing target or message",
//       });
//     }

//     // 🔥 SYSTEM FAKE USER ID (required by schema)
//     const systemUserId = new mongoose.Types.ObjectId();

//     const notification = await Notification.create({
//       userId: systemUserId,   // ✅ FIX (satisfies schema)
//       role: target,
//       type: "admin_message",
//       message,
//     });

//     // 🔥 SOCKET EMIT (your system stays unchanged)
//     io.to(target).emit("newNotification", {
//       message,
//       type: "admin_message",
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Notification sent",
//       data: notification,
//     });

//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: error.message,
//     });
//   }
// };

export const deleteSingleNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // 🔥 CASE 1: ADMIN BROADCAST (admin_message)
    if (notification.type === "admin_message") {
      await Notification.findByIdAndUpdate(id, {
        $addToSet: {
          deletedBy: { userId, role },
        },
      });

      return res.json({ message: "Notification hidden for this user" });
    }

    // 🔥 CASE 2: PERSONAL NOTIFICATION
    // only delete if it belongs to this user
    if (
      notification.userId &&
      notification.userId.toString() === userId.toString()
    ) {
      await Notification.findByIdAndDelete(id);

      return res.json({ message: "Notification deleted permanently" });
    }

    return res.status(403).json({ message: "Unauthorized action" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    // 🔥 1. DELETE ALL PERSONAL NOTIFICATIONS
    await Notification.deleteMany({
      userId: userId,
      type: { $ne: "admin_message" },
    });

    // 🔥 2. HIDE ALL ADMIN BROADCASTS
    await Notification.updateMany(
      { type: "admin_message" },
      {
        $addToSet: {
          deletedBy: { userId, role },
        },
      }
    );

    return res.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};