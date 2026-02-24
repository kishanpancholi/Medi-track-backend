import express from "express";
import mongoose from "mongoose";
import cors from "cors";
// import connectDB from "./config/db.js";
import patientRoutes from "./routes/patientRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

const dbURI = "mongodb+srv://kishan:test123@cluster0.s4imkal.mongodb.net/healthcare?appName=Cluster0";
mongoose.connect(dbURI)
  .then((result) => app.listen(5000))
  .catch((err) => console.log("DB Connection Error:", err));

//middleware
app.use("/api/patient", patientRoutes);

//routes
app.get("/", (req, res) => {
  res.send("Healthcare Backend Running...");
});