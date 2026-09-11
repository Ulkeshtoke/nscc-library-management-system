import express from 'express';
import cors from 'cors';
import booksRouter from './routes/books.js';
import copiesRouter from './routes/copies.js';
import transactionsRouter from './routes/transactions.js';
import dashboardRouter from './routes/dashboard.js';
import membersRouter from './routes/members.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Configure CORS securely with environment and development allowlists
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
];

if (process.env.CLIENT_URL) {
  const normalizedClientUrl = process.env.CLIENT_URL.trim().replace(/\/$/, '');
  if (!allowedOrigins.includes(normalizedClientUrl)) {
    allowedOrigins.push(normalizedClientUrl);
  }
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (curl, server-to-server, mobile, or smoke tests)
    if (!origin) return callback(null, true);

    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isExplicitlyAllowed = allowedOrigins.includes(origin);

    if (isLocalhost || isExplicitlyAllowed) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Request from origin '${origin}' rejected`);
    return callback(new Error(`Origin '${origin}' not permitted by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Library Management System API',
  });
});

// Mount modular API routers
app.use('/api/books', booksRouter);
app.use('/api/copies', copiesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/members', membersRouter);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
