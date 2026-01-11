import { Response } from 'express';
import { Session } from '../models/Session';
import { Group } from '../models/Group';
import { Student } from '../models/Student';
import { AuthRequest } from '../middleware/auth';

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, groupId } = req.query;
    const filter: Record<string, unknown> = { userId: req.user?._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) (filter.date as Record<string, unknown>).$gte = new Date(startDate as string);
      if (endDate) (filter.date as Record<string, unknown>).$lte = new Date(endDate as string);
    }
    if (groupId) filter.groupId = groupId;

    const sessions = await Session.find(filter)
      .populate('groupId')
      .populate('attendance.studentId')
      .sort({ date: -1 });
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getSession = async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user?._id })
      .populate('groupId')
      .populate('attendance.studentId');
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const session = new Session({ ...req.body, userId: req.user?._id });
    await session.save();
    const populated = await Session.findById(session._id)
      .populate('groupId')
      .populate('attendance.studentId');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const updateSession = async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('groupId')
      .populate('attendance.studentId');
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const deleteSession = async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findOneAndDelete({ _id: req.params.id, userId: req.user?._id });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, data: { message: 'Session deleted' } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const updateAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { attendance } = req.body;
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      { attendance },
      { new: true, runValidators: true }
    )
      .populate('groupId')
      .populate('attendance.studentId');
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const getCalendarSessions = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const sessions = await Session.find({
      userId: req.user?._id,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('groupId')
      .sort({ date: 1 });

    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const generateSessions = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, startDate, endDate } = req.body;
    const group = await Group.findOne({ _id: groupId, userId: req.user?._id });
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const students = await Student.find({ userId: req.user?._id, groupId, active: true });
    const studentIds = students.map((s) => s._id);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const createdSessions = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const scheduleItem = group.schedule.find((s) => s.dayOfWeek === dayOfWeek);

      if (scheduleItem) {
        const existingSession = await Session.findOne({
          userId: req.user?._id,
          groupId,
          date: {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lt: new Date(date.setHours(23, 59, 59, 999)),
          },
        });

        if (!existingSession) {
          const session = new Session({
            userId: req.user?._id,
            date: new Date(date),
            startTime: scheduleItem.startTime,
            endTime: scheduleItem.endTime,
            groupId,
            studentIds,
            type: 'scheduled',
            subject: scheduleItem.subject,
            attendance: studentIds.map((id) => ({ studentId: id, status: 'present' })),
          });
          await session.save();
          createdSessions.push(session);
        }
      }
    }

    res.status(201).json({ success: true, data: createdSessions });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

// Duplicate a week's sessions to subsequent weeks
export const duplicateWeekSessions = async (req: AuthRequest, res: Response) => {
  try {
    const { weekStartDate, numberOfWeeks } = req.body;

    if (!weekStartDate || !numberOfWeeks || numberOfWeeks < 1) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    // Get Monday of the source week
    const sourceWeekStart = new Date(weekStartDate);
    sourceWeekStart.setHours(0, 0, 0, 0);

    // Get Sunday of the source week
    const sourceWeekEnd = new Date(sourceWeekStart);
    sourceWeekEnd.setDate(sourceWeekEnd.getDate() + 6);
    sourceWeekEnd.setHours(23, 59, 59, 999);

    // Find all sessions in the source week
    const sourceSessions = await Session.find({
      userId: req.user?._id,
      date: { $gte: sourceWeekStart, $lte: sourceWeekEnd },
    });

    if (sourceSessions.length === 0) {
      return res.status(400).json({ success: false, error: 'No sessions found in the selected week' });
    }

    const createdSessions = [];

    // Duplicate to each subsequent week
    for (let weekOffset = 1; weekOffset <= numberOfWeeks; weekOffset++) {
      for (const sourceSession of sourceSessions) {
        const sourceDate = new Date(sourceSession.date);
        const newDate = new Date(sourceDate);
        newDate.setDate(newDate.getDate() + (weekOffset * 7));

        // Check if session already exists on the target date
        const targetDayStart = new Date(newDate);
        targetDayStart.setHours(0, 0, 0, 0);
        const targetDayEnd = new Date(newDate);
        targetDayEnd.setHours(23, 59, 59, 999);

        const existingSession = await Session.findOne({
          userId: req.user?._id,
          date: { $gte: targetDayStart, $lte: targetDayEnd },
          startTime: sourceSession.startTime,
          endTime: sourceSession.endTime,
        });

        if (!existingSession) {
          const newSession = new Session({
            userId: req.user?._id,
            date: newDate,
            startTime: sourceSession.startTime,
            endTime: sourceSession.endTime,
            groupId: sourceSession.groupId,
            studentIds: sourceSession.studentIds,
            type: sourceSession.type,
            subject: sourceSession.subject,
            attendance: sourceSession.attendance.map((a) => ({
              studentId: a.studentId,
              status: 'present', // Default to present for new sessions
            })),
            notes: sourceSession.notes,
          });
          await newSession.save();
          createdSessions.push(newSession);
        }
      }
    }

    res.status(201).json({ success: true, data: createdSessions, message: `Created ${createdSessions.length} sessions` });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};
