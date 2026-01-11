import { Router } from 'express';
import {
  getNotes,
  getNote,
  getNoteByDate,
  createNote,
  updateNote,
  deleteNote,
  upsertDailyNote,
  togglePin,
} from '../controllers/noteController';

const router = Router();

router.get('/', getNotes);
router.get('/date/:date', getNoteByDate);
router.get('/:id', getNote);
router.post('/', createNote);
router.post('/daily', upsertDailyNote);
router.put('/:id', updateNote);
router.put('/:id/pin', togglePin);
router.delete('/:id', deleteNote);

export default router;
