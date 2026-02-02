import { Router, Request, Response, NextFunction } from 'express';
import { stkPush, mpesaCallback } from '../controllers/mpesaController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/stk-push', protect, (req: Request, res: Response, next: NextFunction) => {
  stkPush(req, res).catch(next);
});

router.post('/callback', (req: Request, res: Response, next: NextFunction) => {
  mpesaCallback(req, res).catch(next);
});

export default router;