import { Request, Response } from 'express';
import { User } from '../models';
import { generateToken, AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập tên đăng nhập/email và mật khẩu' });
    }

    // Allow login with username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      active: true,
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Tên đăng nhập/email hoặc mật khẩu không đúng' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Tên đăng nhập/email hoặc mật khẩu không đúng' });
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        _id: req.user?._id,
        username: req.user?.username,
        name: req.user?.name,
        email: req.user?.email,
        role: req.user?.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const user = await User.findById(req.user?._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'Người dùng không tồn tại' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, data: { message: 'Đổi mật khẩu thành công' } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Admin functions
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, name, email, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Tên đăng nhập đã tồn tại' });
    }

    const user = new User({ username, password, name, email, role: role || 'user' });
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role, active, password } = req.body;
    const updateData: Record<string, unknown> = {};

    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'Người dùng không tồn tại' });
    }

    // Update password separately if provided
    if (password) {
      const userWithPassword = await User.findById(req.params.id);
      if (userWithPassword) {
        userWithPassword.password = password;
        await userWithPassword.save();
      }
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    // Don't allow deleting self
    if (req.params.id === req.user?._id.toString()) {
      return res.status(400).json({ success: false, error: 'Không thể xóa tài khoản của chính mình' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'Người dùng không tồn tại' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Initialize admin user if not exists
export const initAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'admin123',
        name: 'Administrator',
        role: 'admin',
      });
      await admin.save();
      console.log('Default admin user created: admin / admin123');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};
