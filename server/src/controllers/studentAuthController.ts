import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Student } from '../models/Student';
import { Session } from '../models/Session';
import { Payment } from '../models/Payment';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login with student code
export const studentLogin = async (req: Request, res: Response) => {
  try {
    const { studentCode } = req.body;

    if (!studentCode) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập mã học sinh',
      });
    }

    const student = await Student.findOne({
      studentCode: studentCode.toUpperCase(),
      active: true,
    }).populate('groupId');

    if (!student) {
      return res.status(401).json({
        success: false,
        error: 'Mã học sinh không hợp lệ hoặc tài khoản đã bị vô hiệu hóa',
      });
    }

    // Generate JWT token for student
    const token = jwt.sign(
      { studentId: student._id, type: 'student' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          studentCode: student.studentCode,
          school: student.school,
          grade: student.grade,
          groupId: student.groupId,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({
      success: false,
      error: 'Đã xảy ra lỗi khi đăng nhập',
    });
  }
};

// Get student info
export const getStudentInfo = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).studentId;

    const student = await Student.findById(studentId).populate('groupId');

    if (!student || !student.active) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy học sinh',
      });
    }

    res.json({
      success: true,
      data: {
        _id: student._id,
        name: student.name,
        studentCode: student.studentCode,
        school: student.school,
        grade: student.grade,
        groupId: student.groupId,
      },
    });
  } catch (error) {
    console.error('Get student info error:', error);
    res.status(500).json({
      success: false,
      error: 'Đã xảy ra lỗi',
    });
  }
};

// Get student's sessions/schedule
export const getStudentSessions = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).studentId;

    const student = await Student.findById(studentId);
    if (!student || !student.active) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy học sinh',
      });
    }

    // Get sessions for this student (either direct or through group)
    const query: any = {
      $or: [
        { studentIds: studentId },
      ],
    };

    if (student.groupId) {
      query.$or.push({ groupId: student.groupId });
    }

    // Get upcoming and recent sessions (past 30 days to future)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await Session.find({
      ...query,
      date: { $gte: thirtyDaysAgo },
    })
      .populate('groupId')
      .populate({
        path: 'attendance.studentId',
        select: 'name studentCode',
      })
      .sort({ date: 1, startTime: 1 });

    // Filter attendance to only include this student's info
    const sessionsWithStudentAttendance = sessions.map((session) => {
      const sessionObj = session.toObject();
      const studentAttendance = sessionObj.attendance.find(
        (a: any) => a.studentId?._id?.toString() === studentId.toString()
      );

      return {
        _id: sessionObj._id,
        date: sessionObj.date,
        startTime: sessionObj.startTime,
        endTime: sessionObj.endTime,
        subject: sessionObj.subject,
        type: sessionObj.type,
        onlineLink: sessionObj.onlineLink,
        notes: sessionObj.notes,
        groupId: sessionObj.groupId,
        attendance: studentAttendance || null,
      };
    });

    res.json({
      success: true,
      data: sessionsWithStudentAttendance,
    });
  } catch (error) {
    console.error('Get student sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Đã xảy ra lỗi khi lấy lịch học',
    });
  }
};

// Get upcoming session with online link
export const getUpcomingSession = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).studentId;

    const student = await Student.findById(studentId);
    if (!student || !student.active) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy học sinh',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query: any = {
      $or: [{ studentIds: studentId }],
      date: { $gte: today },
    };

    if (student.groupId) {
      query.$or.push({ groupId: student.groupId });
    }

    const upcomingSession = await Session.findOne(query)
      .populate('groupId')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      data: upcomingSession,
    });
  } catch (error) {
    console.error('Get upcoming session error:', error);
    res.status(500).json({
      success: false,
      error: 'Đã xảy ra lỗi',
    });
  }
};

// Get student balance/payment status
export const getStudentBalance = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).studentId;

    const student = await Student.findById(studentId);
    if (!student || !student.active) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy học sinh',
      });
    }

    // Get sessions where this student attended (status = 'present' or 'late')
    const query: any = {
      $or: [{ studentIds: studentId }],
      'attendance.studentId': studentId,
    };

    if (student.groupId) {
      query.$or.push({ groupId: student.groupId });
    }

    const sessions = await Session.find(query);

    // Calculate total sessions where student was present or late
    let attendedSessions = 0;
    sessions.forEach((session) => {
      const attendance = session.attendance.find(
        (a) => a.studentId.toString() === studentId.toString()
      );
      if (attendance && (attendance.status === 'present' || attendance.status === 'late')) {
        attendedSessions++;
      }
    });

    // Calculate total fee
    const totalFee = attendedSessions * student.feePerSession;

    // Get total payments
    const payments = await Payment.find({ studentId });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate balance
    const balance = totalFee - totalPaid;
    const status = balance > 0 ? 'debt' : balance < 0 ? 'credit' : 'paid';

    // Get recent payments
    const recentPayments = await Payment.find({ studentId })
      .sort({ paymentDate: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        feePerSession: student.feePerSession,
        totalSessions: attendedSessions,
        totalFee,
        totalPaid,
        balance,
        status,
        recentPayments: recentPayments.map((p) => ({
          _id: p._id,
          amount: p.amount,
          paymentDate: p.paymentDate,
          method: p.method,
          notes: p.notes,
        })),
      },
    });
  } catch (error) {
    console.error('Get student balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Đã xảy ra lỗi khi lấy thông tin công nợ',
    });
  }
};
