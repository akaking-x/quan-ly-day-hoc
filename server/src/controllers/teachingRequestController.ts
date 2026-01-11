import { Response } from 'express';
import { TeachingRequest, Session, User } from '../models';
import { AuthRequest } from '../middleware/auth';

// Create a new teaching request
export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { substituteId, sessionId, message } = req.body;
    const requesterId = req.user?._id;

    if (!substituteId || !sessionId) {
      return res.status(400).json({ success: false, error: 'Vui lòng chọn người dạy thay và buổi học' });
    }

    if (substituteId === requesterId?.toString()) {
      return res.status(400).json({ success: false, error: 'Không thể gửi yêu cầu cho chính mình' });
    }

    // Check if session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Buổi học không tồn tại' });
    }

    // Check if substitute user exists and is active
    const substitute = await User.findOne({ _id: substituteId, active: true });
    if (!substitute) {
      return res.status(404).json({ success: false, error: 'Người dùng không tồn tại' });
    }

    // Check if there's already a pending request for this session
    const existingRequest = await TeachingRequest.findOne({
      session: sessionId,
      status: 'pending',
    });
    if (existingRequest) {
      return res.status(400).json({ success: false, error: 'Đã có yêu cầu dạy thay đang chờ cho buổi học này' });
    }

    const teachingRequest = new TeachingRequest({
      requester: requesterId,
      substitute: substituteId,
      session: sessionId,
      message,
    });

    await teachingRequest.save();

    // Populate and return
    const populatedRequest = await TeachingRequest.findById(teachingRequest._id)
      .populate('requester', 'name username')
      .populate('substitute', 'name username')
      .populate({
        path: 'session',
        select: 'subject date startTime endTime',
        populate: { path: 'groupId', select: 'name' },
      });

    res.status(201).json({ success: true, data: populatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Get requests I sent (as requester)
export const getMyRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await TeachingRequest.find({ requester: req.user?._id })
      .populate('requester', 'name username')
      .populate('substitute', 'name username')
      .populate({
        path: 'session',
        select: 'subject date startTime endTime',
        populate: { path: 'groupId', select: 'name' },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Get requests sent to me (as substitute)
export const getRequestsForMe = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await TeachingRequest.find({ substitute: req.user?._id })
      .populate('requester', 'name username')
      .populate('substitute', 'name username')
      .populate({
        path: 'session',
        select: 'subject date startTime endTime',
        populate: { path: 'groupId', select: 'name' },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Get all requests (both sent and received)
export const getAllMyRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const requests = await TeachingRequest.find({
      $or: [{ requester: userId }, { substitute: userId }],
    })
      .populate('requester', 'name username')
      .populate('substitute', 'name username')
      .populate({
        path: 'session',
        select: 'subject date startTime endTime',
        populate: { path: 'groupId', select: 'name' },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Get pending requests count for me
export const getPendingCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await TeachingRequest.countDocuments({
      substitute: req.user?._id,
      status: 'pending',
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Accept a request
export const acceptRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { responseMessage } = req.body;

    const request = await TeachingRequest.findOne({
      _id: id,
      substitute: req.user?._id,
      status: 'pending',
    });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Yêu cầu không tồn tại hoặc đã được xử lý' });
    }

    request.status = 'accepted';
    if (responseMessage) {
      request.responseMessage = responseMessage;
    }
    await request.save();

    // Update session to mark substitute teacher
    await Session.findByIdAndUpdate(request.session, {
      substituteTeacher: req.user?._id,
    });

    const populatedRequest = await TeachingRequest.findById(request._id)
      .populate('requester', 'name username')
      .populate('substitute', 'name username')
      .populate({
        path: 'session',
        select: 'subject date startTime endTime',
        populate: { path: 'groupId', select: 'name' },
      });

    res.json({ success: true, data: populatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Decline a request
export const declineRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { responseMessage } = req.body;

    const request = await TeachingRequest.findOne({
      _id: id,
      substitute: req.user?._id,
      status: 'pending',
    });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Yêu cầu không tồn tại hoặc đã được xử lý' });
    }

    request.status = 'declined';
    if (responseMessage) {
      request.responseMessage = responseMessage;
    }
    await request.save();

    const populatedRequest = await TeachingRequest.findById(request._id)
      .populate('requester', 'name username')
      .populate('substitute', 'name username')
      .populate({
        path: 'session',
        select: 'subject date startTime endTime',
        populate: { path: 'groupId', select: 'name' },
      });

    res.json({ success: true, data: populatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Cancel a request (by requester)
export const cancelRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const request = await TeachingRequest.findOne({
      _id: id,
      requester: req.user?._id,
      status: 'pending',
    });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Yêu cầu không tồn tại hoặc đã được xử lý' });
    }

    request.status = 'cancelled';
    await request.save();

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Get available users for substitute (excluding self)
export const getAvailableSubstitutes = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user?._id },
      active: true,
    }).select('name username email');

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
