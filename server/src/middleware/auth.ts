import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'tuition-management-secret-key-2024';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findOne({ _id: decoded.userId, active: true });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Người dùng không tồn tại' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token không hợp lệ' });
  }
};

export const adminOnly = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Chỉ admin mới có quyền thực hiện' });
  }
  next();
};

// Combined auth + admin check middleware
export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findOne({ _id: decoded.userId, active: true });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Người dùng không tồn tại' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Chỉ admin mới có quyền thực hiện' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token không hợp lệ' });
  }
};
