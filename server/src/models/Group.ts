import mongoose, { Document, Schema } from 'mongoose';

export interface IScheduleItem {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
}

// Helper to get current school year (e.g., "2024-2025")
export const getCurrentSchoolYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  // School year starts in September (month 8)
  // If current month is Jan-Aug, we're in the previous year's school year
  if (month < 8) {
    return `${year - 1}-${year}`;
  }
  return `${year}-${year + 1}`;
};

export interface IGroup extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  schoolYear: string;
  schedule: IScheduleItem[];
  defaultFeePerSession: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleItemSchema = new Schema<IScheduleItem>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subject: { type: String, required: true },
  },
  { _id: false }
);

const groupSchema = new Schema<IGroup>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    schoolYear: { type: String, required: true, default: getCurrentSchoolYear },
    schedule: [scheduleItemSchema],
    defaultFeePerSession: { type: Number, required: true, default: 200000 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Prevent duplicate group names within the same school year for the same user
groupSchema.index({ userId: 1, name: 1, schoolYear: 1 }, { unique: true });

export const Group = mongoose.model<IGroup>('Group', groupSchema);
