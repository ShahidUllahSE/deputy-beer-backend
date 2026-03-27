import express, { Application, Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();

app.use(express.json());

// Middleware for CORS
app.use((req: Request, res: Response, next: NextFunction): void => {
  const allowedOrigins = [
    process.env.FRONT_END_URL || 'http://localhost:5173',
    process.env.STAFF_FRONT_END_URL,
  ].filter(Boolean) as string[];
  const requestOrigin = req.headers.origin;

  // Reflect the requesting origin only if it is in the allowlist.
  const matchedOrigin =
    requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0];

  res.setHeader('Access-Control-Allow-Origin', matchedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '1800');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'PUT, POST, GET, DELETE, PATCH, OPTIONS'
  );
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

// Import routes
import authRoutes from './src/routes/auth.routes';
import qrCodeRoutes from './src/routes/qrCode.routes';
import adminRoutes from './src/routes/admin.routes';

// Mount routes
app.use('/api', authRoutes);
app.use('/api', qrCodeRoutes);
app.use('/api/admin', adminRoutes);

console.log('✓ Routes loaded: auth.routes, qrCode.routes, admin.routes');

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running', status: 'ok' });
});

// Handle 404 Not Found
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
