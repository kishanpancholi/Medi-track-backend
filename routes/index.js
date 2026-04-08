import patientRoutes from "./patientRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js";
import adminRoutes from "./adminRoutes.js";
import prescriptionRoutes from "./prescriptionRoutes.js";

//routes
const routes = (app) => {
    app.use("/api/patient", patientRoutes);
    app.use("/api/doctor", doctorRoutes);
    app.use("/api/appointment", appointmentRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/prescription", prescriptionRoutes);
};

export default routes;