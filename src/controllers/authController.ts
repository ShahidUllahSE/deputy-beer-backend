import { Request, Response } from 'express';
import {
  registerUser,
  loginUserService,
  verifyOTPService,
  resendOTPService,
} from '../services/userService';
import {
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/validators';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

type AppRole = 'user' | 'admin' | 'staff';

const createLoginResponse = (user: any) => {
  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      username: user.name,
      role: user.role || 'user',
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  return {
    message: 'Login successful',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      entries_count: user.entries_count || 0,
      role: user.role || 'user',
    },
  };
};

const loginWithExpectedRole = async (
  req: Request,
  res: Response,
  expectedRole?: AppRole | AppRole[]
): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email))
      return res.status(400).json({ message: 'Invalid email' });
    if (!password)
      return res.status(400).json({ message: 'Password is required' });

    const user = await loginUserService(email, password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: 'Your account has been blocked. Please contact support.' });
    }

    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: 'Please verify your email to log in.' });
    }

    if (expectedRole) {
      const allowedRoles = Array.isArray(expectedRole) ? expectedRole : [expectedRole];
      if (!allowedRoles.includes(user.role as AppRole)) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    res.status(200).json(createLoginResponse(user));
  } catch (error: any) {
    console.error('Error in user login:', error);
    if (
      error.message === 'User not found' ||
      error.message === 'Invalid email or password'
    ) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (error.message === 'Email is not verified') {
      return res
        .status(401)
        .json({ message: 'Please verify your email to log in.' });
    }
    res.status(500).json({ message: 'Server error, please try again' });
  }
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password, date_of_birth, is_over_18, role } = req.body;
 
    // Input validation
    if (!validateName(name))
      return res.status(400).json({ message: 'Invalid name' });
    if (!validateEmail(email))
      return res.status(400).json({ message: 'Invalid email' });
    if (!validatePassword(password))
      return res
        .status(400)
        .json({
          message:
            'Password must be at least 8 characters with one letter, one number, and one special character',
        });

    if (!date_of_birth)
      return res.status(400).json({ message: 'Date of birth is required' });
    if (typeof is_over_18 !== 'boolean')
      return res.status(400).json({ message: 'is_over_18 must be a boolean' });

    // Validate role if provided
    if (role && role !== 'user' && role !== 'admin' && role !== 'staff') {
      return res
        .status(400)
        .json({ message: 'Invalid role. Must be "user", "admin" or "staff"' });
    }

    const newUser = await registerUser(
      name,
      email,
      password,
      new Date(date_of_birth),
      is_over_18,
      role || 'user' // Default to 'user' if not provided
    );

    res.status(201).json({
      message:
        'User registered successfully. Please check your email for the verification code.',
      user: {
        _id: newUser?.user._id,
        name: newUser?.user.name,
        email: newUser?.user.email,
      },
      requiresVerification: true,
    });
  } catch (error: any) {
    console.error('Error in user registration:', error);
    if (error.message === 'Email already exists') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error, please try again' });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  return loginWithExpectedRole(req, res);
};

export const registerStaff = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { name, email, password, date_of_birth, is_over_18 } = req.body;

    // Input validation
    if (!validateName(name))
      return res.status(400).json({ message: 'Invalid name' });
    if (!validateEmail(email))
      return res.status(400).json({ message: 'Invalid email' });
    if (!validatePassword(password))
      return res
        .status(400)
        .json({
          message:
            'Password must be at least 8 characters with one letter, one number, and one special character',
        });

    if (!date_of_birth)
      return res.status(400).json({ message: 'Date of birth is required' });
    if (typeof is_over_18 !== 'boolean')
      return res.status(400).json({ message: 'is_over_18 must be a boolean' });

    const newUser = await registerUser(
      name,
      email,
      password,
      new Date(date_of_birth),
      is_over_18,
      'staff'
    );

    res.status(201).json({
      message:
        'User registered successfully. Please check your email for the verification code.',
      user: {
        _id: newUser?.user._id,
        name: newUser?.user.name,
        email: newUser?.user.email,
      },
      requiresVerification: true,
    });
  } catch (error: any) {
    console.error('Error in staff registration:', error);
    if (error.message === 'Email already exists') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error, please try again' });
  }
};

export const loginStaff = async (req: Request, res: Response): Promise<any> => {
  // Staff panel accepts staff users and admins.
  return loginWithExpectedRole(req, res, ['staff', 'admin']);
};

export const verifyOTP = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'OTP must be a 6-digit number' });
    }

    const verifiedUser = await verifyOTPService(email, otp);
    if (!verifiedUser) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    res.status(200).json({
      message: 'Email verified successfully!',
      user: {
        _id: verifiedUser._id,
        name: verifiedUser.name,
        email: verifiedUser.email,
      },
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    if (
      error.message === 'Invalid OTP code' ||
      error.message === 'OTP has expired. Please request a new one.' ||
      error.message === 'Email is already verified' ||
      error.message === 'No OTP found. Please request a new one.'
    ) {
      return res.status(400).json({ message: error.message });
    }
    res
      .status(500)
      .json({ message: 'Failed to verify OTP. Please try again later.' });
  }
};

export const resendOTP = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await resendOTPService(email);

    res.status(200).json({
      message: 'New verification code sent to your email',
    });
  } catch (error: any) {
    console.error('Error resending OTP:', error);
    if (
      error.message === 'User not found' ||
      error.message === 'Email is already verified'
    ) {
      return res.status(400).json({ message: error.message });
    }
    res
      .status(500)
      .json({ message: 'Failed to resend OTP. Please try again later.' });
  }
};
