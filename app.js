import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import connectDB from "./config/db.js";
import patientRoutes from "./routes/patientRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/healthcare")
  .then(() => console.log("DB Connected Successfully"))
  .catch((err) => console.log("DB Connection Error:", err));

app.use("/api/patient", patientRoutes);

app.get("/", (req, res) => {
  res.send("Healthcare Backend Running...");
});

app.listen(5000, () => console.log("Server running on port 5000"));