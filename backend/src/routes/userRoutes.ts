
import { Router } from 'express';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  resetUserPassword, 
  deleteUser 
} from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// All user management routes require authentication and proper institution scope
router.use(protect);

// Restricted to school-level administrators (Principals or Admins)
router.get('/', authorize('ADMIN', 'PRINCIPAL'), getAllUsers);
router.post('/', authorize('ADMIN', 'PRINCIPAL'), createUser);
router.put('/:id', authorize('ADMIN', 'PRINCIPAL'), updateUser);
router.patch('/:id/password', authorize('ADMIN', 'PRINCIPAL'), resetUserPassword);
router.delete('/:id', authorize('ADMIN', 'PRINCIPAL'), deleteUser);

export default router;
