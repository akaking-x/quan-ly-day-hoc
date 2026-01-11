import { Request, Response } from 'express';
import { Setting, defaultSettings } from '../models/Setting';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Setting.find();

    if (settings.length === 0) {
      await Setting.insertMany(defaultSettings);
      settings = await Setting.find();
    }

    const settingsObj: Record<string, unknown> = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      await Setting.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      );
    }

    const settings = await Setting.find();
    const settingsObj: Record<string, unknown> = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};
