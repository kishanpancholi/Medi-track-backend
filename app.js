import express from "express";
import mongoose from "mongoose";
import cors from "cors";
// import connectDB from "./config/db.js";
import patientRoutes from "./routes/patientRoutes.js";

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//database connection
const dbURI =
  "mongodb+srv://kishan:test123@cluster0.s4imkal.mongodb.net/healthcare?appName=Cluster0";
mongoose
  .connect(dbURI)
  .then((result) => app.listen(5000))
  .catch((err) => console.log("DB Connection Error:", err));

//routes
app.use("/api/patient", patientRoutes);

app.get("/", (req, res) => {
  res.send("Healthcare Backend Running...");
});
