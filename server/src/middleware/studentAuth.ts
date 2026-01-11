import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const studentAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Vui lòng đăng nhập để tiếp tục',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET) as {
      studentId: string;
      type: string;
    };

    if (decoded.type !== 'student') {
      return res.status(401).json({
        success: false,
        error: 'Token không hợp lệ',
      });
    }

    (req as any).studentId = decoded.studentId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Phiên đăng nhập đã hết hạn',
    });
  }
};
