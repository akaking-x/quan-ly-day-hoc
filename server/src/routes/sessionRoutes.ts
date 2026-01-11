import { Router } from 'express';
import {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  updateAttendance,
  getCalendarSessions,
  generateSessions,
  duplicateWeekSessions,
} from '../controllers/sessionController';

const router = Router();

router.get('/', getSessions);
router.get('/calendar', getCalendarSessions);
router.post('/generate', generateSessions);
router.post('/duplicate-week', duplicateWeekSessions);
router.get('/:id', getSession);
router.post('/', createSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);
router.post('/:id/attendance', updateAttendance);

export default router;
