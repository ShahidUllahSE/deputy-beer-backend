import { Request, Response } from 'express';
import { getAllUsers, getUserHistory, blockUser, unblockUser, deleteUser, getQRCodeStats } from '../services/adminService';
import { loginUserService } from '../services/userService';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

/**
 * Admin login
 */
export const adminLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await loginUserService(email, password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email to log in.' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        username: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error in admin login:', error);
    if (error.message === 'User not found' || error.message === 'Invalid email or password') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.status(500).json({ message: 'Server error, please try again' });
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsersController = async (req: Request, res: Response): Promise<any> => {
  try {
    const users = await getAllUsers();

    return res.status(200).json({
      message: 'Users retrieved successfully',
      users,
      count: users.length,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      message: 'Server error while fetching users',
      error: error.message,
    });
  }
};

/**
 * Get specific user's history (admin only)
 */
export const getUserHistoryController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Ensure userId is a string (Express params can be string | string[])
    const userIdString = Array.isArray(userId) ? userId[0] : userId;

    const result = await getUserHistory(userIdString);

    return res.status(200).json({
      message: 'User history retrieved successfully',
      history: result.history,
      user: result.user,
      count: result.history.length,
    });
  } catch (error: any) {
    console.error('Error fetching user history:', error);
    return res.status(500).json({
      message: 'Server error while fetching user history',
      error: error.message,
    });
  }
};

/**
 * Block a user (admin only)
 */
export const blockUserController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const user = await blockUser(userIdString);

    return res.status(200).json({
      message: 'User blocked successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error('Error blocking user:', error);
    return res.status(500).json({
      message: 'Server error while blocking user',
      error: error.message,
    });
  }
};

/**
 * Unblock a user (admin only)
 */
export const unblockUserController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const user = await unblockUser(userIdString);

    return res.status(200).json({
      message: 'User unblocked successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error('Error unblocking user:', error);
    return res.status(500).json({
      message: 'Server error while unblocking user',
      error: error.message,
    });
  }
};

/**
 * Delete a user (admin only)
 */
export const deleteUserController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const result = await deleteUser(userIdString);

    return res.status(200).json({
      message: 'User deleted successfully',
      result,
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      message: 'Server error while deleting user',
      error: error.message,
    });
  }
};

/**
 * Get QR code statistics (admin only)
 */
export const getQRCodeStatsController = async (req: Request, res: Response): Promise<any> => {
  try {
    const stats = await getQRCodeStats();
    return res.status(200).json({
      message: 'QR code statistics retrieved successfully',
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching QR code stats:', error);
    return res.status(500).json({
      message: 'Server error while fetching QR code statistics',
      error: error.message,
    });
  }
};
