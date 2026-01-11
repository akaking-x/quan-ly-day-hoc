import { Response } from 'express';
import { Student } from '../models/Student';
import { Session } from '../models/Session';
import { Payment } from '../models/Payment';
import { calculateBalance, calculateFee, getMonthlyBalance } from '../services/feeService';
import { AuthRequest } from '../middleware/auth';

export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const totalStudents = await Student.countDocuments({ userId, active: true });
    const sessionsThisMonth = await Session.countDocuments({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const paymentsThisMonth = await Payment.find({
      userId,
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const revenueThisMonth = paymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);

    const students = await Student.find({ userId, active: true });
    let totalDebt = 0;
    for (const student of students) {
      const balance = await calculateBalance(student._id.toString(), userId?.toString() || '');
      if (balance.balance > 0) totalDebt += balance.balance;
    }

    res.json({
      success: true,
      data: {
        totalStudents,
        sessionsThisMonth,
        revenueThisMonth,
        totalDebt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getMonthlyReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id?.toString() || '';
    const { year, month } = req.query;
    const y = Number(year) || new Date().getFullYear();
    const m = Number(month) || new Date().getMonth() + 1;

    const balances = await getMonthlyBalance(y, m, userId);

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const sessionsCount = await Session.countDocuments({
      userId: req.user?._id,
      date: { $gte: startDate, $lte: endDate },
    });

    const payments = await Payment.find({
      userId: req.user?._id,
      paymentDate: { $gte: startDate, $lte: endDate },
    });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalFees = balances.reduce((sum, b) => sum + b.totalFee, 0);
    const totalDebt = balances.reduce((sum, b) => sum + Math.max(0, b.balance), 0);

    res.json({
      success: true,
      data: {
        year: y,
        month: m,
        sessionsCount,
        totalRevenue,
        totalFees,
        totalDebt,
        students: balances,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getStudentReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id?.toString() || '';
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const student = await Student.findOne({ _id: id, userId: req.user?._id });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const start = startDate ? new Date(startDate as string) : new Date(0);
    const end = endDate ? new Date(endDate as string) : new Date();

    const fee = await calculateFee(id, start, end, userId);
    const balance = await calculateBalance(id, userId);

    const sessions = await Session.find({
      userId: req.user?._id,
      'attendance.studentId': id,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });

    const payments = await Payment.find({
      userId: req.user?._id,
      studentId: id,
      paymentDate: { $gte: start, $lte: end },
    }).sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: {
        student,
        fee,
        balance,
        sessions,
        payments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getBalanceReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id?.toString() || '';
    const students = await Student.find({ userId: req.user?._id, active: true });
    const results = [];

    for (const student of students) {
      const balance = await calculateBalance(student._id.toString(), userId);
      results.push({
        student: {
          _id: student._id,
          name: student.name,
          phone: student.phone,
          feePerSession: student.feePerSession,
        },
        ...balance,
      });
    }

    results.sort((a, b) => b.balance - a.balance);

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getRevenueChart = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const payments = await Payment.find({
        userId: req.user?._id,
        paymentDate: { $gte: date, $lte: endDate },
      });

      const revenue = payments.reduce((sum, p) => sum + p.amount, 0);

      data.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        revenue,
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
