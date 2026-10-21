const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const path = require('path');

// Load environment variables reliably from backend directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect to MongoDB
connectDB();

const app = express();

// Production CORS Allowlist
const allowedOrigins = [
  'https://help.ujjwalraj.online',
  'https://help.feminismindia.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5001',
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.pages.dev')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Basic Health Check Route
app.get('/api/health', async (req, res) => {
  let egressIp = 'unknown';
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    const ipData = await ipRes.json();
    egressIp = ipData.ip;
  } catch (e) {
    egressIp = 'unavailable';
  }

  const isConnected = mongoose.connection.readyState === 1;
  const isAtlas = (process.env.MONGO_URI || '').includes('mongodb.net');
  const jwtLen = (process.env.JWT_SECRET || '').length;

  res.json({
    status: 'ok',
    message: 'Helpdesk API is running',
    database: isConnected ? 'connected' : 'disconnected',
    isAtlasTarget: isAtlas,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtConfigured: jwtLen >= 32,
    jwtLength: jwtLen,
    egressIp: egressIp
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler (Sanitized for production)
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Server Error:', err.message);
  }
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
