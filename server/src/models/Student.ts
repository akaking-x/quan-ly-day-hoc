import mongoose, { Document, Schema } from 'mongoose';

export type StudentStatus = 'weak' | 'average' | 'good' | 'excellent' | 'outstanding';

// Generate random 8-character alphanumeric code
const generateStudentCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  studentCode: string;
  name: string;
  phone?: string;
  school?: string;
  grade?: number;
  feePerSession: number;
  type: 'individual' | 'group';
  groupId?: mongoose.Types.ObjectId;
  notes?: string;
  status?: StudentStatus;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentCode: { type: String, unique: true, uppercase: true },
    name: { type: String, required: true },
    phone: { type: String },
    school: { type: String },
    grade: { type: Number },
    feePerSession: { type: Number, required: true, default: 200000 },
    type: { type: String, enum: ['individual', 'group'], default: 'individual' },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    notes: { type: String },
    status: { type: String, enum: ['weak', 'average', 'good', 'excellent', 'outstanding'] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Generate unique student code before saving
studentSchema.pre('save', async function (next) {
  if (!this.studentCode) {
    let code = generateStudentCode();
    // Ensure uniqueness
    let exists = await mongoose.model('Student').findOne({ studentCode: code });
    while (exists) {
      code = generateStudentCode();
      exists = await mongoose.model('Student').findOne({ studentCode: code });
    }
    this.studentCode = code;
  }
  next();
});

export const Student = mongoose.model<IStudent>('Student', studentSchema);
