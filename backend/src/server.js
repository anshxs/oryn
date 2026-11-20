import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import apiRoutes from './routes/index.js';

/**
 * Creates and configures the Express Application
 * using MVC routing architecture.
 */
export function createExpressApp() {
  const app = express();

  // Global Middleware
  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Request logger for API calls
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Mount central API router under /api
  app.use('/api', apiRoutes);

  // Global 404 handler for unknown API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found.` });
  });

  return app;
}

/**
 * Creates the HTTP and WebSocket Server instance
 * for real-time live inbox updates.
 */
export function createHttpAndWebSocketServer(app) {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const clients = new Set();

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: 'connected', time: new Date().toISOString() }));

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] Client error:', err);
      clients.delete(ws);
    });
  });

  const broadcast = (type, payload) => {
    const message = JSON.stringify({ type, payload });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  };

  app.set('broadcast', broadcast);

  return { server, broadcast };
}
