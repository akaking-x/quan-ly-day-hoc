import { Response } from 'express';
import { Note } from '../models/Note';
import { AuthRequest } from '../middleware/auth';

// Get all notes (with optional filters)
export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { type, startDate, endDate, pinned } = req.query;
    const filter: Record<string, unknown> = { userId: req.user?._id };

    if (type) filter.type = type;
    if (pinned === 'true') filter.pinned = true;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate)
        (filter.date as Record<string, unknown>).$gte = new Date(startDate as string);
      if (endDate)
        (filter.date as Record<string, unknown>).$lte = new Date(endDate as string);
    }

    const notes = await Note.find(filter).sort({ pinned: -1, date: -1, createdAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Get note by date (for daily notes)
export const getNoteByDate = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const note = await Note.findOne({
      userId: req.user?._id,
      type: 'daily',
      date: { $gte: targetDate, $lt: nextDate },
    });

    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Get single note by ID
export const getNote = async (req: AuthRequest, res: Response) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user?._id });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Create or update daily note
export const upsertDailyNote = async (req: AuthRequest, res: Response) => {
  try {
    const { date, content } = req.body;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const note = await Note.findOneAndUpdate(
      {
        userId: req.user?._id,
        type: 'daily',
        date: { $gte: targetDate, $lt: nextDate },
      },
      {
        userId: req.user?._id,
        date: targetDate,
        content,
        type: 'daily',
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: note });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

// Create general note
export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const note = new Note({
      ...req.body,
      userId: req.user?._id,
      type: req.body.type || 'general',
      date: req.body.date || new Date(),
    });
    await note.save();
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

// Update note
export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

// Delete note
export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user?._id });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    res.json({ success: true, data: { message: 'Note deleted' } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Toggle pin status
export const togglePin = async (req: AuthRequest, res: Response) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user?._id });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    note.pinned = !note.pinned;
    await note.save();

    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
