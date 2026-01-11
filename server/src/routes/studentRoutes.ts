import { Router } from 'express';
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentSessions,
  getStudentPayments,
  getStudentBalance,
  generateMissingCodes,
} from '../controllers/studentController';

const router = Router();

router.get('/', getStudents);
router.post('/generate-codes', generateMissingCodes);
router.get('/:id', getStudent);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.get('/:id/sessions', getStudentSessions);
router.get('/:id/payments', getStudentPayments);
router.get('/:id/balance', getStudentBalance);

export default router;
