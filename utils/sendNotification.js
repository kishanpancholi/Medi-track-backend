// import Notification from "../models/Notification.js";

// export const sendNotification = async ({
//   userId,
//   role,
//   type,
//   title,
//   message,
//   link = "/",
// }) => {
//   const notification = await Notification.create({
//     userId,
//     role,
//     type,
//     title,
//     message,
//     link,
//   });

//   console.log("📢 EMITTING TO ROOM:", userId.toString());

//   global.io
//     .to(userId.toString())
//     .emit("newNotification", notification);

//   return notification;
// };
// import Notification from "../models/Notification.js";

// export const sendNotification = async ({
//   userId,
//   role,
//   type,
//   title,
//   message,
//   link = "/",
// }) => {

//   // =========================
//   // ✅ CASE 1: SINGLE USER (EXISTING - DO NOT BREAK)
//   // =========================
//   if (userId) {
//     const notification = await Notification.create({
//       userId,
//       role,
//       type,
//       title,
//       message,
//       link,
//     });

//     console.log("📢 EMITTING TO ROOM:", userId.toString());

//     global.io
//       .to(userId.toString())
//       .emit("newNotification", notification);

//     return notification;
//   }

//   // =========================
//   // ✅ CASE 2: BROADCAST (NEW FOR ADMIN)
//   // =========================

//   let users = [];

//   // 🔹 Load models dynamically (safe way)
//   const Patient = (await import("../models/Patient.js")).default;
//   const Doctor = (await import("../models/Doctor.js")).default;

//   if (role === "Patient") {
//     users = await Patient.find({}, "_id");
//   }

//   if (role === "Doctor") {
//     users = await Doctor.find({}, "_id");
//   }

//   if (role === "All") {
//     const patients = await Patient.find({}, "_id");
//     const doctors = await Doctor.find({}, "_id");

//     users = [...patients, ...doctors];
//   }

//   // 🔥 LOOP THROUGH USERS
//   for (let user of users) {
//     const notification = await Notification.create({
//       userId: user._id,
//       role: role === "All" ? "Patient" : role, // simple handling
//       type,
//       title,
//       message,
//       link,
//     });

//     global.io
//       .to(user._id.toString())
//       .emit("newNotification", notification);
//   }

//   return true;
// };



import Notification from "../models/Notification.js";

export const sendNotification = async ({
  userId,
  role,
  type,
  title,
  message,
  link,
}) => {

  // =========================
  // ✅ CASE 1: SINGLE USER (existing - no change)
  // =========================
  if (userId) {
    const notification = await Notification.create({
      userId,
      role,
      type,
      title,
      message,
      link,
    });

    global.io
      .to(userId.toString())
      .emit("newNotification", notification);

    return notification;
  }

  // =========================
  // ✅ CASE 2: ADMIN (NEW 🔥)
  // =========================
  if (role === "Admin") {
    const Admin = (await import("../models/Admin.js")).default;

    const admins = await Admin.find({}, "_id");

    for (let admin of admins) {
      const notification = await Notification.create({
        userId: admin._id,
        role: "Admin",
        type,
        title,
        message,
        link,
      });

      global.io
        .to(admin._id.toString())
        .emit("newNotification", notification);
    }

    return true;
  }

  // =========================
  // ✅ CASE 3: BROADCAST (existing)
  // =========================

  let users = [];

  const Patient = (await import("../models/Patient.js")).default;
  const Doctor = (await import("../models/Doctor.js")).default;

  if (role === "Patient") {
    users = await Patient.find({}, "_id");
  }

  if (role === "Doctor") {
    users = await Doctor.find({}, "_id");
  }

  if (role === "All") {
    const patients = await Patient.find({}, "_id");
    const doctors = await Doctor.find({}, "_id");

    users = [...patients, ...doctors];
  }

  for (let user of users) {
    const notification = await Notification.create({
      userId: user._id,
      role: role === "All" ? "Patient" : role,
      type,
      title,
      message,
      link,
    });

    global.io
      .to(user._id.toString())
      .emit("newNotification", notification);
  }

  return true;
};