import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// 🔥 Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// 🔥 Make global (so we can use anywhere)
global.io = io;

// 🔥 Socket Connection
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // 👉 Join user-specific room
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User joined room: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});

// ❗ IMPORTANT: use server.listen (NOT app.listen)
server.listen(5000, () => {
  console.log("Server running on port 5000");
});