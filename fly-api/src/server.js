const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5001;

// Set up middleware
app.use(cors({
  origin: '*', // In production, replace with frontend URL to be secure
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Mount the centralized API router
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback 404 route
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized error-handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`FairFly Backend API server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});

module.exports = server; // Exported for integration tests if needed
