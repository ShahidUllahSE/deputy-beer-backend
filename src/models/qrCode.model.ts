import mongoose, { Document, Schema } from 'mongoose';

export interface IQRCode extends Document {
  code: string;
  codeUrl?: string;
  points: number;
  isUsed: boolean;
  usedBy?: mongoose.Schema.Types.ObjectId;
  usedAt?: Date;
  entryId?: mongoose.Schema.Types.ObjectId;
  brand?: string;
}

const QRCodeSchema: Schema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    codeUrl: { type: String },
    points: { type: Number, default: 30, required: true },
    isUsed: { type: Boolean, default: false },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date },
    entryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entry' },
    brand: { type: String },
  },
  { timestamps: true }
);

const QRCode = mongoose.model<IQRCode>('QRCode', QRCodeSchema);
export default QRCode;
