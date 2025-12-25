/**
 * COLLABORATION SERVER
 * WebSocket server for real-time synchronization
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// In-memory session storage (in production, use Redis or similar)
const sessions = new Map();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Create collaboration session
  socket.on('create-session', ({ resourceId, userId }, callback) => {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session = {
      id: sessionId,
      resourceId,
      participants: [userId],
      createdAt: new Date(),
      lastActivityAt: new Date(),
      isActive: true,
    };

    sessions.set(sessionId, session);
    socket.join(sessionId);

    console.log(`Session created: ${sessionId}`);
    callback({ session });
  });

  // Join existing session
  socket.on('join-session', ({ sessionId, userId }, callback) => {
    const session = sessions.get(sessionId);

    if (!session) {
      callback({ error: 'Session not found' });
      return;
    }

    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
    }

    session.lastActivityAt = new Date();
    socket.join(sessionId);

    // Notify other participants
    socket.to(sessionId).emit('participant-joined', { sessionId, userId });

    console.log(`User ${userId} joined session: ${sessionId}`);
    callback({ session });
  });

  // Leave session
  socket.on('leave-session', ({ sessionId, userId }, callback) => {
    const session = sessions.get(sessionId);

    if (!session) {
      callback({ error: 'Session not found' });
      return;
    }

    session.participants = session.participants.filter(id => id !== userId);
    socket.leave(sessionId);

    // Notify other participants
    socket.to(sessionId).emit('participant-left', { sessionId, userId });

    // Delete session if no participants
    if (session.participants.length === 0) {
      sessions.delete(sessionId);
      console.log(`Session deleted: ${sessionId}`);
    }

    console.log(`User ${userId} left session: ${sessionId}`);
    callback({ success: true });
  });

  // Broadcast update to session
  socket.on('update', (update) => {
    const session = sessions.get(update.sessionId);

    if (session) {
      session.lastActivityAt = new Date();
      
      // Broadcast to all clients in session except sender
      socket.to(update.sessionId).emit('update', update);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Remove user from all sessions they're in
    // (In production, track socket-to-user mapping)
  });
});

// Cleanup inactive sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  const TIMEOUT = 30 * 60 * 1000; // 30 minutes

  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActivityAt.getTime() > TIMEOUT) {
      sessions.delete(sessionId);
      console.log(`Cleaned up inactive session: ${sessionId}`);
    }
  }
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🤝 Collaboration server running on port ${PORT}`);
});
