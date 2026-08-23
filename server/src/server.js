const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { initQueue, isInMemory } = require('./queues/executionQueue');
const { runSeed } = require('./scripts/seed');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const executionRoutes = require('./routes/executionRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server, env.clientUrl);

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline styles for canvas UI
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and clientUrl during local dev
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Root Route — confirms backend is live
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Agentflow_AI Orchestration Server',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health',
  });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Agentflow_AI Orchestration Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    features: {
      langGraph: 'available',
      queueMode: isInMemory() ? 'in-memory-fallback' : 'redis-bullmq',
      encryption: 'AES-256-GCM',
    },
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `API Route not found: ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND',
    },
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (err.status >= 400 && err.status < 600 ? err.status : 500);
  const code = err.code || (statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : 'SERVER_ERROR');

  console.error(`[Error Handler] ${req.method} ${req.url} [${statusCode}]:`, err.message);

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'An unexpected internal error occurred.',
      code,
      details: err.details || null,
      stack: env.nodeEnv === 'development' ? err.stack : undefined,
    },
  });
});

// Start Server
const start = async () => {
  try {
    console.log('----------------------------------------------------');
    console.log('⚡ Starting Agentflow_AI Automation Backend Server...');
    console.log('----------------------------------------------------');

    // 1. Connect to Database (with in-memory fallback)
    await connectDB();

    // 2. Initialize Queue System (with in-memory fallback)
    await initQueue();

    // 3. Seed demo accounts and starter workflows
    await runSeed();

    // 4. Listen on configured port
    server.listen(env.port, () => {
      console.log(`🚀 Server listening on http://localhost:${env.port}`);
      console.log(`🌐 Configured Client URL: ${env.clientUrl}`);
      console.log(`📡 Socket.IO Real-time streaming ready`);
      console.log('----------------------------------------------------');
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
};

// Handle process termination signals
process.on('SIGINT', () => {
  console.log('\n[Process] Gracefully shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n[Process] SIGTERM received. Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

if (require.main === module) {
  start();
}

module.exports = { app, server };
