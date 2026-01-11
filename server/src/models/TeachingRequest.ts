import mongoose, { Schema, Document } from 'mongoose';

export interface ITeachingRequest extends Document {
  requester: mongoose.Types.ObjectId;
  substitute: mongoose.Types.ObjectId;
  session: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  responseMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const teachingRequestSchema = new Schema<ITeachingRequest>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    substitute: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
    },
    message: {
      type: String,
      trim: true,
    },
    responseMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
teachingRequestSchema.index({ requester: 1, status: 1 });
teachingRequestSchema.index({ substitute: 1, status: 1 });
teachingRequestSchema.index({ session: 1 });

export const TeachingRequest = mongoose.model<ITeachingRequest>('TeachingRequest', teachingRequestSchema);
