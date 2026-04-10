import dotenv from "dotenv";
dotenv.config(); // .env file ne load karse
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

//database connection
connectDB();

const app = express();

// middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

routes(app);

app.get("/", (req, res) => {
  res.send("Healthcare Backend Running...");
});

//create a http server
const server = http.createServer(app);

//SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  //room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User join room: ${roomId}`);
  });

  // Offer
  socket.on("offer", ({ offer, roomId }) => {
    socket.to(roomId).emit("offer", offer);
  });

  // Answer
  socket.on("answer", ({ answer, roomId }) => {
    socket.to(roomId).emit("answer", answer);
  });

  // ICE Candidate
  socket.on("ice-candidate", ({ candidate, roomId }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
