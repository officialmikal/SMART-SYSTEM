import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import classRoutes from './routes/classRoutes';
import paymentRoutes from './routes/paymentRoutes';
import staffRoutes from './routes/staffRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import examRoutes from './routes/examRoutes';
import markRoutes from './routes/markRoutes';
import mpesaRoutes from './routes/mpesaRoutes';
import { getAuditLogs } from './controllers/adminController';
import { protect, authorize } from './middleware/auth';

const app = express();

// Security Headers
// Fix: Added 'as any' to resolve middleware type mismatch with Express app.use overloads
app.use(helmet() as any);

// Typed CORS Configuration
const allowedOrigins = [
  config.FRONTEND_URL,
  'https://smart-system-wlnh.onrender.com',
  'https://elimusmart-production.netlify.app'
];

// Fix: Added 'as any' to resolve middleware type mismatch with Express app.use overloads
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*') || config.FRONTEND_URL === '*') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}) as any);

// Fix: Used any casting to bypass type mismatch between morgan and express middleware overloads
app.use(morgan('dev') as any);
// Fix: Added 'as any' to resolve middleware type mismatch with Express app.use overloads
app.use(express.json() as any);

// Main API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/mpesa', mpesaRoutes);

// Admin Routes (New)
app.get('/api/admin/logs', protect, authorize('ADMIN'), (req: any, res: any) => {
  getAuditLogs(req, res);
});

// Health Endpoint
// Fix: Used any for req and res to resolve Property 'status' does not exist error
app.get('/health', (_req: any, res: any) => {
  res.status(200).send('API is healthy');
});

export default app;