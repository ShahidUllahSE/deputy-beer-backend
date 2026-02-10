import { Router } from 'express';
import {
  validateQRCodeController,
  scanQRCodeController,
  submitEntryController,
  getUserEntriesController,
  getUserScanHistoryController,
  getUserPointsStatsController,
} from '../controllers/qrCodeController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Validate a single QR code (public endpoint, but can be protected if needed)
router.post('/validate', validateQRCodeController);

// Scan QR code and award points (protected)
router.post('/scan', authMiddleware, scanQRCodeController);

// Submit entry with 4 QR codes (protected)
router.post('/submit-entry', authMiddleware, submitEntryController);

// Get user's entries (protected)
router.get('/entries', authMiddleware, getUserEntriesController);

// Get user's scan history (protected)
router.get('/scan-history', authMiddleware, getUserScanHistoryController);

// Get user's points statistics (protected)
router.get('/points-stats', authMiddleware, getUserPointsStatsController);

export default router;
