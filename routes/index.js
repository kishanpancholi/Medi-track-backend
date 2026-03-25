import patientRoutes from "./patientRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js";

//routes
const routes = (app) => {
    app.use("/api/Patient", patientRoutes);
    app.use("/api/doctor", doctorRoutes);
    app.use("/api/appointment", appointmentRoutes);
};

export default routes;