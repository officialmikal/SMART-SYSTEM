import { Router, Request, Response, NextFunction } from 'express';
import { getExpenditures, createExpenditure, updateExpenditure, deleteExpenditure } from '../controllers/expenditureController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', authorize('ADMIN', 'PRINCIPAL', 'FINANCE'), (req: Request, res: Response, next: NextFunction) => {
  getExpenditures(req, res).catch(next);
});

router.post('/', authorize('ADMIN', 'PRINCIPAL', 'FINANCE'), (req: Request, res: Response, next: NextFunction) => {
  createExpenditure(req, res).catch(next);
});

router.put('/:id', authorize('ADMIN', 'PRINCIPAL', 'FINANCE'), (req: Request, res: Response, next: NextFunction) => {
  updateExpenditure(req, res).catch(next);
});

router.delete('/:id', authorize('ADMIN', 'PRINCIPAL', 'FINANCE'), (req: Request, res: Response, next: NextFunction) => {
  deleteExpenditure(req, res).catch(next);
});

export default router;
