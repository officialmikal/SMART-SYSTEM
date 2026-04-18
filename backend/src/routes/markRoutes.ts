import { Router, Request, Response, NextFunction } from 'express';
import { bulkUpsertMarks, getStudentResults, getClassResults } from '../controllers/markController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/bulk', authorize('ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'SUBJECT_TEACHER'), (req: Request, res: Response, next: NextFunction) => {
  bulkUpsertMarks(req, res).catch(next);
});

router.get('/student/:studentId', (req: Request, res: Response, next: NextFunction) => {
  getStudentResults(req, res).catch(next);
});

router.get('/class/:classId', (req: Request, res: Response, next: NextFunction) => {
  getClassResults(req, res).catch(next);
});

export default router;