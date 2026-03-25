import dotenv from "dotenv";
dotenv.config();// .env file ne load karse
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import cookieParser from "cookie-parser";

//database connection
connectDB();

const app = express();

//middleware
app.use(cors({
  origin: process.env.HOST,
  credentials: true,
})
);
app.use(express.json());
app.use(cookieParser());

routes(app);

app.get("/", (req, res) => {
  res.send("Healthcare Backend Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});