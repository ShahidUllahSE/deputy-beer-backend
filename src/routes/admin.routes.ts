import { Router } from 'express';
import {
  adminLogin,
  getAllUsersController,
  getUserHistoryController,
  blockUserController,
  unblockUserController,
  deleteUserController,
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

// Block user (protected - admin only)
router.patch('/users/:userId/block', adminMiddleware, blockUserController);

// Unblock user (protected - admin only)
router.patch('/users/:userId/unblock', adminMiddleware, unblockUserController);

// Delete user (protected - admin only)
router.delete('/users/:userId', adminMiddleware, deleteUserController);

// Get QR code statistics (protected - admin only)
router.get('/qr-stats', adminMiddleware, getQRCodeStatsController);

export default router;
