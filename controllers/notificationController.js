import Notification from "../models/Notification.js";
import { notificationMessages } from "../utils/notificationMessages.js";
import { sendNotification } from "../utils/sendNotification.js";
import Admin from "../models/Admin.js";
import mongoose from "mongoose";

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
// export const sendAdminNotification = async (req, res) => {
//   try {
//     const { target, message } = req.body;

//     if (!target || !message) {
//       return res.status(400).json({
//         message: "Missing target or message",
//       });
//     }

//     // ✅ TEMP SYSTEM ADMIN ID (required by schema)
//     const systemUserId = new mongoose.Types.ObjectId();

//     const notification = await Notification.create({
//       userId: systemUserId,   // 🔥 FIXED (required field satisfied)
//       role: "Admin",
//       type: "admin_message",
//       message,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Notification stored successfully",
//       data: notification,
//     });

//   } catch (error) {
//     console.log("❌ ERROR:", error);
//     return res.status(500).json({
//       message: error.message,
//     });
//   }
// };




export const sendAdminNotification = async (req, res) => {
  try {
    const { target, message } = req.body;

    if (!target || !message) {
      return res.status(400).json({
        message: "Missing target or message",
      });
    }

    // 🔥 SYSTEM FAKE USER ID (required by schema)
    const systemUserId = new mongoose.Types.ObjectId();

    const notification = await Notification.create({
      userId: systemUserId,   // ✅ FIX (satisfies schema)
      role: target,
      type: "admin_message",
      message,
    });

    // 🔥 SOCKET EMIT (your system stays unchanged)
    io.to(target).emit("newNotification", {
      message,
      type: "admin_message",
    });

    return res.status(200).json({
      success: true,
      message: "Notification sent",
      data: notification,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};



// export const sendAdminNotification = async (req, res) => {
//   try {
//     console.log("🔥 API HIT");
//     console.log("BODY:", req.body);

//     const { target, message } = req.body;

//     if (!target || !message) {
//       return res.status(400).json({
//         message: "Missing target or message",
//       });
//     }

//     console.log("✅ Data received:", target, message);

//     return res.status(200).json({
//       message: "Notification sent successfully",
//     });

//   } catch (error) {
//     console.log("❌ ERROR:", error);
//     return res.status(500).json({
//       message: error.message,
//     });
//   }
// };