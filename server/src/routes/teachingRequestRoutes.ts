import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  createRequest,
  getMyRequests,
  getRequestsForMe,
  getAllMyRequests,
  getPendingCount,
  acceptRequest,
  declineRequest,
  cancelRequest,
  getAvailableSubstitutes,
} from '../controllers/teachingRequestController';

const router = Router();

// All routes require authentication
router.use(auth);

// Get available substitute teachers
router.get('/substitutes', getAvailableSubstitutes);

// Get pending requests count
router.get('/pending-count', getPendingCount);

// Get all my requests (both sent and received)
router.get('/all', getAllMyRequests);

// Get requests I sent
router.get('/sent', getMyRequests);

// Get requests sent to me
router.get('/received', getRequestsForMe);

// Create a new request
router.post('/', createRequest);

// Accept a request
router.put('/:id/accept', acceptRequest);

// Decline a request
router.put('/:id/decline', declineRequest);

// Cancel a request
router.put('/:id/cancel', cancelRequest);

export default router;
