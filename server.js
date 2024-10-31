const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Track users in each room
const rooms = {};

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(userId);

    // Broadcast new user to others in the room
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    // Send list of all connected users to the new user
    socket.emit(
      "all-users",
      rooms[roomId].filter((id) => id !== userId)
    );

    // Handle user disconnection
    socket.on("disconnect", () => {
      rooms[roomId] = rooms[roomId].filter((id) => id !== userId);
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });

  // Handle signaling events
  socket.on("offer", (roomId, offer, targetUserId) => {
    socket.to(targetUserId).emit("offer", offer, socket.id);
  });
  socket.on("answer", (roomId, answer, targetUserId) => {
    socket.to(targetUserId).emit("answer", answer, socket.id);
  });
  socket.on("ice-candidate", (roomId, candidate, targetUserId) => {
    socket.to(targetUserId).emit("ice-candidate", candidate, socket.id);
  });
});

server.listen(3001, "0.0.0.0", () => {
  console.log("Signaling server running on http://0.0.0.0:3001");
});
