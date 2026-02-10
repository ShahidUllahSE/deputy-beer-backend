import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  date_of_birth: Date;
  is_over_18: boolean;
  password: string;
  isActive: boolean;
  isVerified: boolean;
  verificationOTP: string;
  verificationOTPExpiry: Date | null;
  entries_count: number;
  points: number;
  created_at: Date;
  role: 'user' | 'admin';
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    date_of_birth: { type: Date, required: true },
    is_over_18: { type: Boolean, required: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationOTP: { type: String },
    verificationOTPExpiry: { type: Date, default: null },
    entries_count: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
