
import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { getSmsLogs, sendBulkSms, getSmsSettings, updateSmsSettings } from '../controllers/messagingController';

const router = Router();

router.use(protect);

router.get('/logs', authorize('ADMIN', 'PRINCIPAL'), getSmsLogs);
router.post('/send-bulk', authorize('ADMIN', 'PRINCIPAL'), sendBulkSms);
router.get('/settings', authorize('ADMIN', 'PRINCIPAL'), getSmsSettings);
router.put('/settings', authorize('ADMIN', 'PRINCIPAL'), updateSmsSettings);

export default router;
