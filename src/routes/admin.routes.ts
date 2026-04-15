import { Router } from 'express';
import {
  adminLogin,
  getAllUsersController,
  getAllStaffUsersController,
  getUserHistoryController,
  getStaffUserHistoryController,
  blockUserController,
  blockStaffUserController,
  unblockUserController,
  unblockStaffUserController,
  deleteUserController,
  updateStaffUserController,
  deleteStaffUserController,
  getQRCodeStatsController,
} from '../controllers/adminController';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

// Admin login (public endpoint)
router.post('/login', adminLogin);

// Get all users (protected - admin only)
router.get('/users', adminMiddleware, getAllUsersController);

// Get specific user's history (protected - admin only)
router.get('/users/:userId/history', adminMiddleware, getUserHistoryController);

// Get all staff users (protected - admin only)
router.get('/staff-users', adminMiddleware, getAllStaffUsersController);

// Get specific staff user's history (protected - admin only)
router.get('/staff-users/:userId/history', adminMiddleware, getStaffUserHistoryController);

// Block user (protected - admin only)
router.patch('/users/:userId/block', adminMiddleware, blockUserController);

// Block staff user (protected - admin only)
router.patch('/staff-users/:userId/block', adminMiddleware, blockStaffUserController);

// Unblock user (protected - admin only)
router.patch('/users/:userId/unblock', adminMiddleware, unblockUserController);

// Unblock staff user (protected - admin only)
router.patch('/staff-users/:userId/unblock', adminMiddleware, unblockStaffUserController);

// Delete user (protected - admin only)
router.delete('/users/:userId', adminMiddleware, deleteUserController);

// Update staff user (protected - admin only)
router.patch('/staff-users/:userId', adminMiddleware, updateStaffUserController);

// Delete staff user (protected - admin only)
router.delete('/staff-users/:userId', adminMiddleware, deleteStaffUserController);

// Get QR code statistics (protected - admin only)
router.get('/qr-stats', adminMiddleware, getQRCodeStatsController);

export default router;
