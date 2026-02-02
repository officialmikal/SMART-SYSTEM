import { Router, Request, Response, NextFunction } from 'express';
import { getAllStaff, createStaff, updateStaff, deleteStaff } from '../controllers/staffController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  getAllStaff(req, res).catch(next);
});

router.post('/', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  createStaff(req, res).catch(next);
});

router.put('/:id', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  updateStaff(req, res).catch(next);
});

router.delete('/:id', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  deleteStaff(req, res).catch(next);
});

export default router;