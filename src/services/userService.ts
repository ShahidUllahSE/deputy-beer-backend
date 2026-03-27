import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';
import { sendOTPEmail, generateOTP } from '../utils/emailService';

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  date_of_birth: Date,
  is_over_18: boolean,
  role: 'user' | 'admin' | 'staff' = 'user'
): Promise<{ user: IUser; otp: string } | null> => {
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const otp = generateOTP(6);
    const otpExpiry = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    const newUser: IUser = new User({
      name,
      email,
      date_of_birth,
      is_over_18,
      password: hashedPassword,
      verificationOTP: otp,
      verificationOTPExpiry: otpExpiry,
      role: role || 'user',
    });

    await newUser.save();

    // Send OTP via email
    await sendOTPEmail(email, otp, name);

    return { user: newUser, otp };
  } catch (error) {
    console.error('Error in registerUser service:', error);
    throw new Error('Error registering user');
  }
};

export const loginUserService = async (
  email: string,
  password: string
): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    if (!user.isVerified) throw new Error('Email is not verified');

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) throw new Error('Invalid email or password');

    return user;
  } catch (error) {
    console.error('Error in loginUserService:', error);
    throw new Error('Error logging in');
  }
};

export const verifyOTPService = async (
  email: string,
  otp: string
): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    if (user.isVerified) {
      throw new Error('Email is already verified');
    }

    if (!user.verificationOTP) {
      throw new Error('No OTP found. Please request a new one.');
    }

    if (user.verificationOTP !== otp) {
      throw new Error('Invalid OTP code');
    }

    if (
      user.verificationOTPExpiry &&
      user.verificationOTPExpiry < new Date()
    ) {
      throw new Error('OTP has expired. Please request a new one.');
    }

    user.isVerified = true;
    user.verificationOTP = '';
    user.verificationOTPExpiry = null;
    await user.save();

    return user;
  } catch (error) {
    console.error('Error in verifyOTPService:', error);
    throw error;
  }
};

export const resendOTPService = async (
  email: string
): Promise<{ otp: string }> => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    if (user.isVerified) {
      throw new Error('Email is already verified');
    }

    // Generate new 6-digit OTP
    const otp = generateOTP(6);
    const otpExpiry = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    user.verificationOTP = otp;
    user.verificationOTPExpiry = otpExpiry;
    await user.save();

    // Send OTP via email
    await sendOTPEmail(email, otp, user.name);

    return { otp };
  } catch (error) {
    console.error('Error in resendOTPService:', error);
    throw error;
  }
};
