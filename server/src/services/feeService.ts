import mongoose from 'mongoose';
import { Session } from '../models/Session';
import { Student } from '../models/Student';
import { Payment } from '../models/Payment';

export interface FeeCalculation {
  sessions: number;
  feePerSession: number;
  totalFee: number;
}

export interface BalanceCalculation {
  totalFee: number;
  totalPaid: number;
  balance: number;
  status: 'debt' | 'credit' | 'paid';
}

export const calculateFee = async (
  studentId: string,
  startDate: Date,
  endDate: Date,
  userId: string
): Promise<FeeCalculation> => {
  const student = await Student.findOne({ _id: studentId, userId: new mongoose.Types.ObjectId(userId) });
  if (!student) {
    throw new Error('Student not found');
  }

  const sessions = await Session.find({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: startDate, $lte: endDate },
    'attendance.studentId': new mongoose.Types.ObjectId(studentId),
    'attendance.status': { $in: ['present', 'late', 'absent'] },
  });

  let attendedCount = 0;
  sessions.forEach((session) => {
    const attendance = session.attendance.find(
      (a) => a.studentId.toString() === studentId && a.status !== 'excused'
    );
    if (attendance) {
      attendedCount++;
    }
  });

  return {
    sessions: attendedCount,
    feePerSession: student.feePerSession,
    totalFee: attendedCount * student.feePerSession,
  };
};

export const calculateBalance = async (studentId: string, userId: string): Promise<BalanceCalculation> => {
  const student = await Student.findOne({ _id: studentId, userId: new mongoose.Types.ObjectId(userId) });
  if (!student) {
    throw new Error('Student not found');
  }

  const sessions = await Session.find({
    userId: new mongoose.Types.ObjectId(userId),
    'attendance.studentId': new mongoose.Types.ObjectId(studentId),
  });

  let totalSessions = 0;
  sessions.forEach((session) => {
    const attendance = session.attendance.find(
      (a) => a.studentId.toString() === studentId && a.status !== 'excused'
    );
    if (attendance) {
      totalSessions++;
    }
  });

  const totalFee = totalSessions * student.feePerSession;

  const payments = await Payment.find({
    userId: new mongoose.Types.ObjectId(userId),
    studentId: new mongoose.Types.ObjectId(studentId),
  });
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const balance = totalFee - totalPaid;

  return {
    totalFee,
    totalPaid,
    balance,
    status: balance > 0 ? 'debt' : balance < 0 ? 'credit' : 'paid',
  };
};

export const getMonthlyBalance = async (year: number, month: number, userId: string) => {
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const students = await Student.find({ userId: new mongoose.Types.ObjectId(userId), active: true });
  const results = [];

  for (const student of students) {
    const fee = await calculateFee(student._id.toString(), startDate, endDate, userId);

    // Find payments for this month by checking if payment period overlaps with the month
    const payments = await Payment.find({
      userId: new mongoose.Types.ObjectId(userId),
      studentId: student._id,
      $or: [
        // Payment date is within this month
        { paymentDate: { $gte: startDate, $lte: endDate } },
        // Or period overlaps with this month
        {
          periodStart: { $lte: endDate },
          periodEnd: { $gte: startDate },
        },
      ],
    });
    const paidInPeriod = payments.reduce((sum, p) => sum + p.amount, 0);
    // Only mark as paid if there are sessions to pay for AND payment covers the fee
    // If no sessions, it's not "paid" - it's just "no sessions"
    const isPaid = fee.totalFee > 0 && paidInPeriod >= fee.totalFee;

    results.push({
      student: {
        _id: student._id,
        name: student.name,
        feePerSession: student.feePerSession,
      },
      sessions: fee.sessions,
      totalFee: fee.totalFee,
      paid: paidInPeriod,
      balance: fee.totalFee - paidInPeriod,
      isPaid,
    });
  }

  // Sort: unpaid first, then by name
  results.sort((a, b) => {
    if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
    return a.student.name.localeCompare(b.student.name);
  });

  return results;
};
