import dotenv from "dotenv";
dotenv.config();// .env file ne load karse
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//database connection
connectDB();

//routes
app.use("/api/Patient", patientRoutes);
app.use("/api/Doctor", doctorRoutes);

app.get("/", (req, res) => {
  res.send("Healthcare Backend Running...");
});

app.listen(process.env.PORT);