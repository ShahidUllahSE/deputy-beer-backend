import mongoose, { Document, Schema } from 'mongoose';

export interface IEntry extends Document {
  user: mongoose.Schema.Types.ObjectId;
  qrCodes: string[]; // Array of 4 QR code strings
  submittedAt: Date;
  isWinner: boolean;
  weekNumber?: number; // Week when entry was submitted
}

const EntrySchema: Schema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    qrCodes: { type: [String], required: true, validate: [arrayLimit, 'Entry must contain exactly 4 QR codes'] },
    submittedAt: { type: Date, default: Date.now },
    isWinner: { type: Boolean, default: false },
    weekNumber: { type: Number },
  },
  { timestamps: true }
);

// Validator function to ensure exactly 4 QR codes
function arrayLimit(val: string[]): boolean {
  return val.length === 4;
}

const Entry = mongoose.model<IEntry>('Entry', EntrySchema);
export default Entry;
