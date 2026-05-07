// import dotenv from "dotenv";
// dotenv.config(); // .env file ne load karse
// import express from "express";
// import cors from "cors";
// import connectDB from "./config/db.js";
// import routes from "./routes/index.js";
// import cookieParser from "cookie-parser";
// import cloudinary from "./config/cloudinary.js"; 

// //database connection
// connectDB();

// const app = express();

// // middleware
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL,
//     credentials: true,
//   }),
// );

// app.use(express.json());
// app.use(cookieParser());

// app.use("/uploads", express.static("uploads"));

// routes(app);

// app.get("/", (req, res) => {
//   res.send("Healthcare Backend Running...");
// });

// app.use((err, req, res, next) => {
//   console.error("GLOBAL ERROR:", err);

//   res.status(500).json({
//     message: "Internal Server Error",
//   });
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import cookieParser from "cookie-parser";
import cloudinary from "./config/cloudinary.js";
import http from "http";
import { Server } from "socket.io";

// 🔗 Connect DB
connectDB();

const app = express();

// CREATE HTTP SERVER (IMPORTANT)
const server = http.createServer(app);

// SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // e.g. http://localhost:3000
    credentials: true,
  },
});

// 🔥 MAKE SOCKET GLOBAL
global.io = io;

// 🔥 SOCKET CONNECTION
io.on("connection", (socket) => {
  // console.log("✅ User connected:", socket.id);

  // 👇 USER JOINS THEIR ROOM
  socket.on("join", (userId) => {
    socket.join(userId);
    // console.log("📦 Joined room:", userId);
  });
 
  socket.on("disconnect", () => {
    // console.log("❌ User disconnected");
  });
});

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static("uploads"));

// ================= ROUTES =================
routes(app);

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.send("Healthcare Backend Running...");
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  res.status(500).json({
    message: "Internal Server Error",
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

// ❗ IMPORTANT: use server.listen NOT app.listen
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});