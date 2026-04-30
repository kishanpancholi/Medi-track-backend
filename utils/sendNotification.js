import Notification from "../models/Notification.js";

export const sendNotification = async ({
  userId,
  role,
  type,
  title,
  message,
  link = "/",
}) => {
  const notification = await Notification.create({
    userId,
    role,
    type,
    title,
    message,
    link,
  });

  global.io.to(userId.toString()).emit("newNotification", notification);

  return notification;
};