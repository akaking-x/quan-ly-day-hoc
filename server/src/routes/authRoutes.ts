import { Router } from 'express';
import {
  login,
  getMe,
  changePassword,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/authController';
import { auth, adminOnly } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', auth, getMe);
router.put('/change-password', auth, changePassword);

// Admin only routes
router.get('/users', auth, adminOnly, getUsers);
router.post('/users', auth, adminOnly, createUser);
router.put('/users/:id', auth, adminOnly, updateUser);
router.delete('/users/:id', auth, adminOnly, deleteUser);

export default router;
