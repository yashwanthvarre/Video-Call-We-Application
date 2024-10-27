const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
  socket.on("offer", (roomId, offer) => {
    socket.to(roomId).emit("offer", offer);
  });
  socket.on("answer", (roomId, answer) => {
    socket.to(roomId).emit("answer", answer);
  });
  socket.on("ice-candidate", (roomId, candidate) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });
});

server.listen(3001, "0.0.0.0", () => {
  console.log("Signaling server running on http://0.0.0.0:3001");
});
