import { Router, Request, Response, NextFunction } from 'express';
import { getExams, createExam, updateExam, deleteExam } from '../controllers/examController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  getExams(req, res).catch(next);
});

router.post('/', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  createExam(req, res).catch(next);
});

router.put('/:id', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  updateExam(req, res).catch(next);
});

router.delete('/:id', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  deleteExam(req, res).catch(next);
});

export default router;