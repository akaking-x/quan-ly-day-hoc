import { Router } from 'express';
import { studentAuth } from '../middleware/studentAuth';
import {
  studentLogin,
  getStudentInfo,
  getStudentSessions,
  getUpcomingSession,
  getStudentBalance,
} from '../controllers/studentAuthController';

const router = Router();

// Public route - student login
router.post('/login', studentLogin);

// Protected routes - require student authentication
router.get('/me', studentAuth, getStudentInfo);
router.get('/sessions', studentAuth, getStudentSessions);
router.get('/upcoming', studentAuth, getUpcomingSession);
router.get('/balance', studentAuth, getStudentBalance);

export default router;
