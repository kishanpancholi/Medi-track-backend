import Notification from "../models/Notification.js";

const sendNotification = async ({
  userId,
  role,
  type,
  message,
  link,
  relatedId,
}) => {
  // 1. Save in DB
  const notification = await Notification.create({
    userId,
    role,
    type,
    message,
    link,
    relatedId,
  });

  // 2. 🔥 Emit real-time event
  if (global.io) {
    global.io
      .to(userId.toString())
      .emit("newNotification", notification);
  }

  return notification;
};

export default sendNotification;