import { Router, Request, Response, NextFunction } from 'express';
import { getPayments, recordPayment, getStudentPayments } from '../controllers/paymentController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  getPayments(req, res).catch(next);
});

router.get('/student/:studentId', (req: Request, res: Response, next: NextFunction) => {
  getStudentPayments(req, res).catch(next);
});

router.post('/', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  recordPayment(req, res).catch(next);
});

export default router;