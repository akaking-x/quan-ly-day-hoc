import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  content: string;
  type: 'daily' | 'general';
  title?: string;
  tags?: string[];
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    content: { type: String, default: '' },
    type: { type: String, enum: ['daily', 'general'], default: 'daily' },
    title: { type: String },
    tags: [{ type: String }],
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for efficient queries
noteSchema.index({ userId: 1, date: 1, type: 1 });
noteSchema.index({ userId: 1, type: 1, pinned: -1, createdAt: -1 });

export const Note = mongoose.model<INote>('Note', noteSchema);
