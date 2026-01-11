import { Router } from 'express';
import {
  getSummary,
  getMonthlyReport,
  getStudentReport,
  getBalanceReport,
  getRevenueChart,
} from '../controllers/reportController';

const router = Router();

router.get('/summary', getSummary);
router.get('/monthly', getMonthlyReport);
router.get('/balance', getBalanceReport);
router.get('/chart', getRevenueChart);
router.get('/student/:id', getStudentReport);

export default router;
