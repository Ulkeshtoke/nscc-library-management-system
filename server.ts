import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './server/src/config/db.js';
import { seedInitialDataIfEmpty } from './server/src/config/seed.js';
import booksRouter from './server/src/routes/books.js';
import copiesRouter from './server/src/routes/copies.js';
import transactionsRouter from './server/src/routes/transactions.js';
import dashboardRouter from './server/src/routes/dashboard.js';
import membersRouter from './server/src/routes/members.js';
import { errorHandler } from './server/src/middleware/errorHandler.js';

async function startServer() {
  try {
    await connectDB();
    await seedInitialDataIfEmpty();
  } catch (dbErr) {
    console.warn('[Server] DB startup warning:', dbErr.message);
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API health route
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'Library Management System API',
    });
  });

  // Mount API endpoints
  app.use('/api/books', booksRouter);
  app.use('/api/copies', copiesRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/members', membersRouter);

  // Central error handler for API
  app.use(errorHandler);

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
