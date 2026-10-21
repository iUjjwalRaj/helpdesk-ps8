const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Core Middleware
app.use(cors());
app.use(express.json());

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Helpdesk API is running' });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));

// 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
