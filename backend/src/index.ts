import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { initSocket } from './lib/socket';
import { errorHandler, notFound } from './middleware/errorHandler';
import { swaggerSpec } from './swagger';

import dashboardRouter from './routes/dashboard';
import bookingsRouter from './routes/bookings';
import mechanicsRouter from './routes/mechanics';
import customersRouter from './routes/customers';

const app = express();
const httpServer = http.createServer(app);

const PORT = parseInt(process.env.PORT || '5000', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Initialize WebSocket
initSocket(httpServer, CORS_ORIGIN);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [CORS_ORIGIN, 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' } },
});
app.use('/api', limiter);

// Body parsing & logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Instant Mechanic API Docs',
}));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// Routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/mechanics', mechanicsRouter);
app.use('/api/customers', customersRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`\n🚗 Instant Mechanic API running on port ${PORT}`);
  console.log(`📖 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}\n`);
});

export default app;
