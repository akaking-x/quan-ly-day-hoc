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
    const { year, month } = req.query;

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

    // Lọc theo tháng/năm nếu có, ngược lại lấy 30 ngày gần đây và tương lai
    let dateFilter: any;
    if (year && month) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      dateFilter = { $gte: startDate, $lte: endDate };
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = { $gte: thirtyDaysAgo };
    }

    const sessions = await Session.find({
      ...query,
      date: dateFilter,
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
    const { year, month } = req.query;

    const student = await Student.findById(studentId);
    if (!student || !student.active) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy học sinh',
      });
    }

    // Get sessions where this student attended
    const query: any = {
      $or: [{ studentIds: studentId }],
      'attendance.studentId': studentId,
    };

    if (student.groupId) {
      query.$or.push({ groupId: student.groupId });
    }

    // Lọc theo tháng/năm nếu có
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (year && month) {
      startDate = new Date(Number(year), Number(month) - 1, 1);
      endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const sessions = await Session.find(query);

    // Calculate total sessions where student needs to pay
    // Logic: present, late, absent (vắng không phép) = thu tiền
    //        excused (vắng có phép) = không thu tiền
    let attendedSessions = 0;
    let totalFee = 0;
    sessions.forEach((session) => {
      const attendance = session.attendance.find(
        (a) => a.studentId.toString() === studentId.toString() && a.status !== 'excused'
      );
      if (attendance) {
        attendedSessions++;
        // Dùng học phí đã lưu trong attendance, nếu không có thì dùng học phí hiện tại
        const fee = (attendance as any).feePerSession ?? student.feePerSession;
        totalFee += fee;
      }
    });

    // Get payments (lọc theo tháng/năm nếu có)
    let paymentQuery: any = { studentId };
    if (startDate && endDate) {
      paymentQuery.$or = [
        { paymentDate: { $gte: startDate, $lte: endDate } },
        { periodStart: { $lte: endDate }, periodEnd: { $gte: startDate } },
      ];
    }
    const payments = await Payment.find(paymentQuery).sort({ paymentDate: -1 });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate balance
    const balance = totalFee - totalPaid;
    const status = balance > 0 ? 'debt' : balance < 0 ? 'credit' : 'paid';

    // Get recent payments (trong tháng nếu có filter, hoặc 5 cái gần nhất)
    const recentPayments = year && month ? payments : payments.slice(0, 5);

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
