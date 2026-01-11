import { Router } from 'express';
import authRoutes from './authRoutes';
import studentAuthRoutes from './studentAuthRoutes';
import studentRoutes from './studentRoutes';
import groupRoutes from './groupRoutes';
import sessionRoutes from './sessionRoutes';
import paymentRoutes from './paymentRoutes';
import reportRoutes from './reportRoutes';
import settingRoutes from './settingRoutes';
import noteRoutes from './noteRoutes';
import teachingRequestRoutes from './teachingRequestRoutes';
import databaseRoutes from './databaseRoutes';
import { auth } from '../middleware/auth';

const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/student-portal', studentAuthRoutes);

// Protected routes (require authentication)
router.use('/students', auth, studentRoutes);
router.use('/groups', auth, groupRoutes);
router.use('/sessions', auth, sessionRoutes);
router.use('/payments', auth, paymentRoutes);
router.use('/reports', auth, reportRoutes);
router.use('/settings', auth, settingRoutes);
router.use('/notes', auth, noteRoutes);
router.use('/teaching-requests', auth, teachingRequestRoutes);

// Admin only routes (database management)
router.use('/database', databaseRoutes);

export default router;
