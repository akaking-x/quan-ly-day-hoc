import { Response } from 'express';
import { Student } from '../models/Student';
import { Session } from '../models/Session';
import { Payment } from '../models/Payment';
import { calculateBalance } from '../services/feeService';
import { AuthRequest } from '../middleware/auth';

// Helper function to generate student code
const generateStudentCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { active, type, groupId, search } = req.query;
    const filter: Record<string, unknown> = { userId: req.user?._id };

    if (active !== undefined) filter.active = active === 'true';
    if (type) filter.type = type;
    if (groupId) filter.groupId = groupId;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const students = await Student.find(filter).populate('groupId').sort({ name: 1 });

    // Auto-generate codes for students without codes
    for (const student of students) {
      if (!student.studentCode) {
        let code = generateStudentCode();
        let exists = await Student.findOne({ studentCode: code });
        while (exists) {
          code = generateStudentCode();
          exists = await Student.findOne({ studentCode: code });
        }
        student.studentCode = code;
        await student.save();
      }
    }

    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, userId: req.user?._id }).populate('groupId');
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Auto-generate code if missing
    if (!student.studentCode) {
      let code = generateStudentCode();
      let exists = await Student.findOne({ studentCode: code });
      while (exists) {
        code = generateStudentCode();
        exists = await Student.findOne({ studentCode: code });
      }
      student.studentCode = code;
      await student.save();
    }

    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = new Student({ ...req.body, userId: req.user?._id });
    await student.save();
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      { active: false },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getStudentSessions = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await Session.find({
      userId: req.user?._id,
      'attendance.studentId': req.params.id,
    }).sort({ date: -1 });
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getStudentPayments = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await Payment.find({ userId: req.user?._id, studentId: req.params.id }).sort({ paymentDate: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getStudentBalance = async (req: AuthRequest, res: Response) => {
  try {
    const balance = await calculateBalance(req.params.id, req.user?._id.toString() || '');
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Generate student codes for existing students without codes
export const generateMissingCodes = async (req: AuthRequest, res: Response) => {
  try {
    const studentsWithoutCode = await Student.find({
      userId: req.user?._id,
      $or: [{ studentCode: { $exists: false } }, { studentCode: null }, { studentCode: '' }],
    });

    const generateCode = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let updatedCount = 0;
    for (const student of studentsWithoutCode) {
      let code = generateCode();
      let exists = await Student.findOne({ studentCode: code });
      while (exists) {
        code = generateCode();
        exists = await Student.findOne({ studentCode: code });
      }
      student.studentCode = code;
      await student.save();
      updatedCount++;
    }

    res.json({
      success: true,
      data: {
        message: `Đã tạo mã cho ${updatedCount} học sinh`,
        updatedCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
