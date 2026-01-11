import mongoose, { Document, Schema } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface IAttendance {
  studentId: mongoose.Types.ObjectId;
  status: AttendanceStatus;
  note?: string;
}

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  groupId?: mongoose.Types.ObjectId;
  studentIds: mongoose.Types.ObjectId[];
  type: 'scheduled' | 'makeup';
  subject: string;
  notes?: string;
  onlineLink?: string;
  attendance: IAttendance[];
  substituteTeacher?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'present' },
    note: { type: String },
  },
  { _id: false }
);

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    type: { type: String, enum: ['scheduled', 'makeup'], default: 'scheduled' },
    subject: { type: String, required: true },
    notes: { type: String },
    onlineLink: { type: String },
    attendance: [attendanceSchema],
    substituteTeacher: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Session = mongoose.model<ISession>('Session', sessionSchema);
