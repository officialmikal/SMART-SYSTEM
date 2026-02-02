import { Router, Request, Response, NextFunction } from 'express';
import { getClasses, createClass, updateClassFee } from '../controllers/classController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  getClasses(req, res).catch(next);
});

router.post('/', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  createClass(req, res).catch(next);
});

router.put('/:classId/fee', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  updateClassFee(req, res).catch(next);
});

export default router;