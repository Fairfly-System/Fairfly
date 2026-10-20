const express = require('express');// Import the Express framework
const cors = require('cors');// Import the CORS middleware
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config(); // Fallback for root CWD

//Require the centralized API routes (the ./routes folder, which contains all the individual route files, since only the folder is required, it will automatically look for an index.js file in that folder)
const apiRoutes = require('./routes');

//Instantiate the Express application
const app = express();
app.disable('x-powered-by');

// Set the port from environment variables or default to 5001
const PORT = process.env.APP_PORT || 5001;

// Allowed Origins from .env and production fairfly domains
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim().replace(/\/+$/, '')) : []),
  'https://fairfly-1e83b.web.app',
  'https://fairfly-1e83b.firebaseapp.com'
].filter(Boolean);

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff'); //Prevents the browser from trying to guess the content type of a file 
  res.setHeader('X-Frame-Options', 'DENY'); //Prevents clickjacking attacks
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self';"); //Prevents XSS attacks
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); //Forces the browser to use HTTPS
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); //Prevents the browser from sending the referrer header to the server
  next();
});

// Simple CORS configuration: only allow listed origins, block server-to-server (no origin)
const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Block server-to-server calls (requests without an Origin header)
    if (!origin) {
      return callback(new Error('Blocked by CORS policy: Server-to-server requests are not allowed'));
    }

    const cleanOrigin = origin.trim().replace(/\/+$/, '');
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`Blocked by CORS policy: Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

// Apply CORS — bypass origin check for:
// 1. External machine webhooks (PayMongo HMAC-verified) and /health
// 2. Same-origin requests proxied by Firebase Hosting (where the browser does not attach an Origin header for GET/HEAD requests, but x-forwarded-host matches our allowed domains)
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook' || req.path === '/health') {
    return next();
  }

  // Detect same-origin requests routed through Firebase Hosting rewrites
  const forwardedHost = (req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const originHeader = req.headers.origin;

  if (!originHeader && forwardedHost) {
    const isForwardedHostAllowed = allowedOrigins.some(origin => {
      try {
        return new URL(origin).host.toLowerCase() === forwardedHost.toLowerCase();
      } catch {
        return false;
      }
    });

    if (isForwardedHostAllowed) {
      return next(); // Same-origin request from authorized Firebase Hosting domain
    }
  }

  return corsMiddleware(req, res, next);
});

// Parse JSON requests — skip multipart/form-data so multer can handle file uploads
// (Cloud Functions pre-parses the body; consuming it here breaks multer's stream)
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/form-data')) {
    return next(); // Let multer handle multipart parsing
  }
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })(req, res, next);
});

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
  if (err && err.message && err.message.startsWith('Blocked by CORS policy')) {
    return res.status(403).json({ error: err.message });
  }
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start local dev server only when NOT running inside Cloud Functions or Firebase CLI
if (!process.env.K_SERVICE && !process.env.FUNCTION_NAME && !process.env.FIREBASE_CONFIG) {
  const server = app.listen(PORT, () => {
    console.log(`FairFly Backend API server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

// Export the Express app for Firebase Cloud Functions (loaded by index.js)
module.exports = { app };
