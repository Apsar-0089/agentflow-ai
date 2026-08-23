const { Server } = require('socket.io');

let ioInstance = null;

const initSocket = (server, clientUrl) => {
  const allowedOrigins = [
    clientUrl || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  ioInstance = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Allow during dev
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join execution specific room
    socket.on('join:execution', (executionId) => {
      if (executionId) {
        socket.join(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined execution room execution:${executionId}`);
      }
    });

    // Leave execution room
    socket.on('leave:execution', (executionId) => {
      if (executionId) {
        socket.leave(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left execution room execution:${executionId}`);
      }
    });

    // Join user notification room
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user channel user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

const getIO = () => {
  return ioInstance;
};

const emitExecutionEvent = (executionId, payload) => {
  if (ioInstance && executionId) {
    ioInstance.to(`execution:${executionId}`).emit('execution:event', payload);
    // Also broadcast globally for dashboard execution lists
    ioInstance.emit('execution:stream', { executionId, ...payload });
  }
};

const emitExecutionStatus = (executionId, statusData) => {
  if (ioInstance && executionId) {
    ioInstance.to(`execution:${executionId}`).emit('execution:status', statusData);
    ioInstance.emit('execution:status_change', { executionId, ...statusData });
  }
};

const emitNotification = (userId, notification) => {
  if (ioInstance) {
    if (userId) {
      ioInstance.to(`user:${userId}`).emit('notification:new', notification);
    }
    ioInstance.emit('notification:broadcast', notification);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitExecutionEvent,
  emitExecutionStatus,
  emitNotification,
};
