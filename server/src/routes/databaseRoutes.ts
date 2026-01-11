import { Router } from 'express';
import {
  getDatabaseInfo,
  testConnection,
  switchDatabase,
  migrateData,
} from '../controllers/databaseController';
import { adminAuth } from '../middleware/auth';

const router = Router();

// All database routes require admin authentication
router.get('/info', adminAuth, getDatabaseInfo);
router.post('/test', adminAuth, testConnection);
router.post('/switch', adminAuth, switchDatabase);
router.post('/migrate', adminAuth, migrateData);

export default router;
