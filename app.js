import dotenv from "dotenv";
dotenv.config();// .env file ne load karse
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";

//database connection
connectDB();

const app = express();

//middleware
app.use(cors());
app.use(express.json());

routes(app);

app.get("/", (req, res) => {
  res.send("Healthcare Backend Running...");
});

app.listen(process.env.PORT);