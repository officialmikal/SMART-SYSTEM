
import { Router, Request, Response, NextFunction } from 'express';
import { login, getMe, changePassword } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  login(req, res).catch(next);
});

router.get('/me', protect, (req: Request, res: Response, next: NextFunction) => {
  getMe(req, res).catch(next);
});

router.put('/change-password', protect, (req: Request, res: Response, next: NextFunction) => {
  changePassword(req, res).catch(next);
});

export default router;
