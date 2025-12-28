/**
 * WebRTC Signaling Server
 * Handles peer-to-peer connection signaling for video calls
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store room users
const rooms = new Map();

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    // Add user to room
    rooms.get(roomId).add(socket.id);
    
    // Notify room users about the new user
    const roomUsers = Array.from(rooms.get(roomId));
    socket.to(roomId).emit('user-joined', socket.id);
    
    // Send current room users to the new user
    socket.emit('room-users', roomUsers.filter(id => id !== socket.id));
    
    console.log(`User ${socket.id} joined room ${roomId}. Users in room:`, roomUsers);
  });

  // Handle signaling messages
  socket.on('signal', (data) => {
    const { to, signal } = data;
    console.log(`Relaying signal from ${socket.id} to ${to}`);
    
    // Relay the signal to the target user
    io.to(to).emit('signal', {
      from: socket.id,
      signal
    });
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove user from all rooms
    rooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        
        // Notify other users in the room
        socket.to(roomId).emit('user-disconnected', socket.id);
        
        // Clean up empty rooms
        if (users.size === 0) {
          rooms.delete(roomId);
        }
        
        console.log(`User ${socket.id} removed from room ${roomId}. Remaining users:`, Array.from(users));
      }
    });
  });

  // Handle leaving a room explicitly
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    
    if (rooms.has(roomId)) {
      rooms.get(roomId).delete(socket.id);
      socket.to(roomId).emit('user-disconnected', socket.id);
      
      // Clean up empty rooms
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      }
    }
    
    console.log(`User ${socket.id} left room ${roomId}`);
  });
});

const PORT = process.env.SIGNALING_PORT || 3001;

server.listen(PORT, () => {
  console.log(`WebRTC Signaling Server running on port ${PORT}`);
  console.log(`CORS enabled for: http://localhost:3000, http://localhost:5173`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
