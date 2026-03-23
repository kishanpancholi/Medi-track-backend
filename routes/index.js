import patientRoutes from "./patientRoutes.js";
import doctorRoutes from "./doctorRoutes.js";

//routes
const routes = (app) => {
    app.use("/api/Patient", patientRoutes);
    app.use("/api/doctor", doctorRoutes);
    // app.use("/api/patients", patientRoutes);
};

export default routes;