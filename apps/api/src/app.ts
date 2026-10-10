import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import registrationRoutes from './routes/registrations.js';
import organizerRoutes from './routes/organizer.js';
import adminRoutes from './routes/admin.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // 2. CORS Configuration
  app.use(cors({
    origin: (origin, callback) => {
      // Allow localhost, local network, and configured CLIENT_URL
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === env.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local previewing and recruitment assessment
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role', 'x-user-email', 'x-user-name'],
  }));

  // 3. Structured Request Logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // 4. Body Parsers
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // 5. Rate Limiting for sensitive actions
  const registrationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP. Please wait a moment and try again.',
      },
    },
  });

  // 6. Mount REST API Routes
  const prefix = env.API_PREFIX;
  app.use(prefix, healthRoutes);
  app.use(prefix, authRoutes);
  app.use(prefix, eventRoutes);
  app.use(`${prefix}/events`, registrationLimiter);
  app.use(prefix, registrationRoutes);
  app.use(prefix, organizerRoutes);
  app.use(prefix, adminRoutes);

  // 7. 404 Route Catch-all
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `API endpoint [${req.method} ${req.originalUrl}] not found.`,
      },
    });
  });

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
