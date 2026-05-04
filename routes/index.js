import patientRoutes from "./patientRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js";
import adminRoutes from "./adminRoutes.js";
import prescriptionRoutes from "./prescriptionRoutes.js";
import medicalRecordRoutes from "./medicalRecordRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import chatbotRoutes from "./chatbotRoutes.js";

//routes
const routes = (app) => {
  app.use("/api/patient", patientRoutes);
  app.use("/api/doctor", doctorRoutes);
  app.use("/api/appointment", appointmentRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/prescription", prescriptionRoutes);
  app.use("/api/record", medicalRecordRoutes);
  app.use("/api/review", reviewRoutes);
  app.use("/api/notification", notificationRoutes);
  app.use("/api/chatbot", chatbotRoutes);
};

export default routes;