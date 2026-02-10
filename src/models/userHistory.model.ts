import mongoose, { Document, Schema } from 'mongoose';

export interface IUserHistory extends Document {
  user_id: mongoose.Schema.Types.ObjectId;
  qrCode: string;
  points_earned: number;
  points_used: number;
  reference_id: string;
  type: string;
  scannedAt: Date;
  entryId?: mongoose.Schema.Types.ObjectId;
}

const UserHistorySchema: Schema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    qrCode: { type: String, required: true },
    points_earned: { type: Number, default: 0 },
    points_used: { type: Number, default: 0 },
    reference_id: { type: String, default: '' },
    type: { type: String, default: 'QRCodeScan' },
    scannedAt: { type: Date, default: Date.now },
    entryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entry' },
  },
  { timestamps: true }
);

const UserHistory = mongoose.model<IUserHistory>('UserHistory', UserHistorySchema);
export default UserHistory;
