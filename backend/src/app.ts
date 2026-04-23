
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
import messagingRoutes from './routes/messagingRoutes';
import userRoutes from './routes/userRoutes';
import expenditureRoutes from './routes/expenditureRoutes';
import { getAuditLogs } from './controllers/adminController';
import { protect, authorize } from './middleware/auth';

const app = express();

// Security Headers
// app.use(helmet() as any);

// Dynamic CORS Configuration for Production/SaaS Architecture
const allowedOrigins = [
  config.FRONTEND_URL,
  'https://legendary-clafoutis-44b967.netlify.app', // Current temporary frontend
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
].filter(Boolean); // Remove empty or undefined origins

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, postman, or curl)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                     allowedOrigins.includes('*') || 
                     config.FRONTEND_URL === '*' ||
                     origin.endsWith('.netlify.app') || // Allow all netlify previews
                     origin.includes('aistudio.google.com') ||
                     origin.includes('run.app');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}) as any);

app.use(morgan('dev') as any);
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
app.use('/api/messaging', messagingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenditures', expenditureRoutes);

// Admin Routes
app.get('/api/admin/logs', protect, authorize('ADMIN'), (req: any, res: any) => {
  getAuditLogs(req, res);
});

// Health Endpoint
app.get('/health', async (_req: any, res: any) => {
  try {
    const { default: sequelize } = await import('./config/database');
    await sequelize.authenticate();
    res.status(200).send('API is healthy');
  } catch (error) {
    res.status(503).send('Database connection unavailable');
  }
});

export default app;
