import { Router } from 'express';
import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupStudents,
  addStudentToGroup,
  removeStudentFromGroup,
  getSchoolYears,
  advanceToNextYear,
} from '../controllers/groupController';

const router = Router();

router.get('/', getGroups);
router.get('/school-years', getSchoolYears);
router.get('/:id', getGroup);
router.post('/', createGroup);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.get('/:id/students', getGroupStudents);
router.post('/:id/students', addStudentToGroup);
router.delete('/:id/students/:studentId', removeStudentFromGroup);
router.post('/:id/advance', advanceToNextYear);

export default router;
