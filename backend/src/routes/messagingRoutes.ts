
import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { getSmsLogs, sendBulkSms } from '../controllers/messagingController';

const router = Router();

router.use(protect);

router.get('/logs', authorize('ADMIN', 'PRINCIPAL'), getSmsLogs);
router.post('/send-bulk', authorize('ADMIN', 'PRINCIPAL'), sendBulkSms);

export default router;
