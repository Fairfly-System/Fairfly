const express = require('express');// Import the Express framework
const cors = require('cors');// Import the CORS middleware
require('dotenv').config();// Load environment variables from a .env file

//Require the centralized API routes (the ./routes folder, which contains all the individual route files, since only the folder is required, it will automatically look for an index.js file in that folder)
const apiRoutes = require('./routes');

//Instantiate the Express application
const app = express();

// Set the port from environment variables or default to 5001
const PORT = process.env.PORT || 5000;

// Set up middleware
app.use(cors({
  origin: '*', // In production, replace with frontend URL to be secure
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());//Use express.json() to parse incoming JSON requests (POST/PUT/PATCH)

// Admin action audit logger — fires post-response via res.on('finish')
const { adminLogger } = require('./middleware/adminLogger');
app.use(adminLogger); //All requests pass through this logger which calls the writeAdminActionToDB function to log all admin actions to the database

// Mount the centralized API router
app.use('/api', apiRoutes); //All API requests pass through this router which routes them to the appropriate controller

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback 404 route (No other route matched)
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
