import { Router, Request, Response, NextFunction } from 'express';
import { bulkRecordAttendance, getStudentAttendance, getClassAttendance } from '../controllers/attendanceController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/bulk', authorize('ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'), (req: Request, res: Response, next: NextFunction) => {
  bulkRecordAttendance(req, res).catch(next);
});

router.get('/student/:studentId', (req: Request, res: Response, next: NextFunction) => {
  getStudentAttendance(req, res).catch(next);
});

router.get('/class/:classId', (req: Request, res: Response, next: NextFunction) => {
  getClassAttendance(req, res).catch(next);
});

export default router;