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
  origin: "http://localhost:3000",
  credentials: true,
})
);
app.use(express.json());
app.use(cookieParser());

routes(app);

app.get("/", (req, res) => {
  res.send("Healthcare Backend Running...");
});

app.listen(process.env.PORT);