import { Request, Response } from 'express';
import {
  getAllUsers,
  getAllStaffUsers,
  getUserHistory,
  getStaffUserHistory,
  blockUser,
  blockStaffUser,
  unblockUser,
  unblockStaffUser,
  deleteUser,
  deleteStaffUser,
  updateStaffUser,
  getQRCodeStats,
} from '../services/adminService';
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
 * Get only staff users (admin only)
 */
export const getAllStaffUsersController = async (req: Request, res: Response): Promise<any> => {
  try {
    const pageParam = Number.parseInt(String(req.query.page ?? '1'), 10);
    const limitParam = Number.parseInt(String(req.query.limit ?? '10'), 10);
    const page = Number.isNaN(pageParam) ? 1 : pageParam;
    const limit = Number.isNaN(limitParam) ? 10 : limitParam;
    const result = await getAllStaffUsers(page, limit);

    return res.status(200).json({
      message: 'Staff users retrieved successfully',
      users: result.users,
      count: result.users.length,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error fetching staff users:', error);
    return res.status(500).json({
      message: 'Server error while fetching staff users',
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
 * Get specific staff user's history (admin only)
 */
export const getStaffUserHistoryController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const result = await getStaffUserHistory(userIdString);

    return res.status(200).json({
      message: 'Staff user history retrieved successfully',
      history: result.history,
      user: result.user,
      count: result.history.length,
    });
  } catch (error: any) {
    console.error('Error fetching staff user history:', error);
    return res.status(500).json({
      message: 'Server error while fetching staff user history',
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
 * Block a staff user (admin only)
 */
export const blockStaffUserController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const user = await blockStaffUser(userIdString);

    return res.status(200).json({
      message: 'Staff user blocked successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error('Error blocking staff user:', error);
    return res.status(500).json({
      message: 'Server error while blocking staff user',
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
 * Unblock a staff user (admin only)
 */
export const unblockStaffUserController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const user = await unblockStaffUser(userIdString);

    return res.status(200).json({
      message: 'Staff user unblocked successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error('Error unblocking staff user:', error);
    return res.status(500).json({
      message: 'Server error while unblocking staff user',
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
 * Update a staff user (admin only)
 */
export const updateStaffUserController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const allowedUpdates = {
      name: req.body.name,
      email: req.body.email,
      isActive: req.body.isActive,
      isVerified: req.body.isVerified,
    };

    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const user = await updateStaffUser(userIdString, allowedUpdates);

    return res.status(200).json({
      message: 'Staff user updated successfully',
      user,
    });
  } catch (error: any) {
    console.error('Error updating staff user:', error);
    return res.status(500).json({
      message: 'Server error while updating staff user',
      error: error.message,
    });
  }
};

/**
 * Delete a staff user (admin only)
 */
export const deleteStaffUserController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    const result = await deleteStaffUser(userIdString);

    return res.status(200).json({
      message: 'Staff user deleted successfully',
      result,
    });
  } catch (error: any) {
    console.error('Error deleting staff user:', error);
    return res.status(500).json({
      message: 'Server error while deleting staff user',
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
