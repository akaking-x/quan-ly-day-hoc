import mongoose, { Document, Schema } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: unknown;
}

const settingSchema = new Schema<ISetting>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
});

export const Setting = mongoose.model<ISetting>('Setting', settingSchema);

export const defaultSettings = [
  { key: 'defaultFeePerSession', value: 200000 },
  { key: 'currency', value: 'VNĐ' },
  { key: 'reminderDays', value: 5 },
  { key: 'subjects', value: ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh', 'Sử', 'Địa', 'GDCD', 'Tin học'] },
  { key: 'workingHoursStart', value: 6 },
  { key: 'workingHoursEnd', value: 22 },
  { key: 'gradientFrom', value: '#3B82F6' },
  { key: 'gradientTo', value: '#8B5CF6' },
];
