import { Router, Request, Response, NextFunction } from 'express';
import { 
  getAllStudents, 
  createStudent, 
  getStudentById, 
  updateStudent, 
  deleteStudent 
} from '../controllers/studentController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  getAllStudents(req, res).catch(next);
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  getStudentById(req, res).catch(next);
});

router.post('/', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  createStudent(req, res).catch(next);
});

router.put('/:id', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  updateStudent(req, res).catch(next);
});

router.delete('/:id', authorize('ADMIN', 'PRINCIPAL'), (req: Request, res: Response, next: NextFunction) => {
  deleteStudent(req, res).catch(next);
});

export default router;