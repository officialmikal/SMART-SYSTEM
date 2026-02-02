import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import classRoutes from './routes/classRoutes';
import paymentRoutes from './routes/paymentRoutes';
import staffRoutes from './routes/staffRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import examRoutes from './routes/examRoutes';
import markRoutes from './routes/markRoutes';
import mpesaRoutes from './routes/mpesaRoutes';

const app = express();

// Standard express middleware initialization with proper typing
// Fix: Use 'as any' to avoid PathParams overload mismatch errors with standard middleware
app.use(helmet() as any);
app.use(cors() as any);
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

// Simple health check endpoint
// Fix: Use any for req and res to bypass missing 'status' property error reported by compiler
app.get('/health', (req: any, res: any) => {
  res.status(200).send('API is healthy');
});

export default app;