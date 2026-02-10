import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  validateQRCode,
  scanQRCode,
  submitEntry,
  getUserEntries,
  getUserScanHistory,
  getUserPointsStats,
} from '../services/qrCodeService';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Validate a single QR code (for checking before submission)
 */
export const validateQRCodeController = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'QR code is required' });
    }

    const qrCode = await validateQRCode(code);

    if (!qrCode) {
      return res.status(400).json({
        message: 'QR code is invalid or has already been used',
        isValid: false,
      });
    }

    return res.status(200).json({
      message: 'QR code is valid',
      isValid: true,
      points: qrCode.points || 30,
    });
  } catch (error: any) {
    console.error('Error validating QR code:', error);
    return res.status(500).json({
      message: 'Server error while validating QR code',
      error: error.message,
    });
  }
};

/**
 * Scan QR code and award points (protected)
 */
export const scanQRCodeController = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'QR code is required' });
    }

    const result = await scanQRCode(userId, code);

    return res.status(200).json({
      message: `QR Code scanned successfully! You earned ${result.pointsEarned} points.`,
      qrCode: {
        code: result.qrCode.code,
        points: result.pointsEarned,
      },
      user: {
        _id: result.user._id,
        points: result.user.points,
      },
      history: {
        scannedAt: result.history.scannedAt,
      },
    });
  } catch (error: any) {
    console.error('Error scanning QR code:', error);
    return res.status(500).json({
      message: error.message || 'Server error while scanning QR code',
      error: error.message,
    });
  }
};

/**
 * Submit an entry with 4 QR codes
 * Requires authentication
 */
export const submitEntryController = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    // Extract userId from token (authMiddleware would do this, but we need it here)
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    const { qrCodes } = req.body;

    if (!qrCodes || !Array.isArray(qrCodes)) {
      return res.status(400).json({
        message: 'QR codes array is required',
      });
    }

    if (qrCodes.length !== 4) {
      return res.status(400).json({
        message: 'Exactly 4 QR codes are required for an entry',
      });
    }

    const result = await submitEntry(userId, qrCodes);

    return res.status(200).json({
      message: result.message,
      entry: result.entry,
    });
  } catch (error: any) {
    console.error('Error submitting entry:', error);
    return res.status(500).json({
      message: error.message || 'Server error while submitting entry',
      error: error.message,
    });
  }
};

/**
 * Get user's entry history
 * Requires authentication
 */
export const getUserEntriesController = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    const entries = await getUserEntries(userId);

    return res.status(200).json({
      message: 'Entries retrieved successfully',
      entries: entries,
      count: entries.length,
    });
  } catch (error: any) {
    console.error('Error fetching entries:', error);
    return res.status(500).json({
      message: 'Server error while fetching entries',
      error: error.message,
    });
  }
};

/**
 * Get user's scan history (which QR codes they scanned)
 * Requires authentication
 */
export const getUserScanHistoryController = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    const history = await getUserScanHistory(userId);

    return res.status(200).json({
      message: 'Scan history retrieved successfully',
      history: history,
      count: history.length,
    });
  } catch (error: any) {
    console.error('Error fetching scan history:', error);
    return res.status(500).json({
      message: 'Server error while fetching scan history',
      error: error.message,
    });
  }
};

/**
 * Get user's points statistics
 * Requires authentication
 */
export const getUserPointsStatsController = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    const stats = await getUserPointsStats(userId);

    return res.status(200).json({
      message: 'Points statistics retrieved successfully',
      stats: stats,
    });
  } catch (error: any) {
    console.error('Error fetching points stats:', error);
    return res.status(500).json({
      message: 'Server error while fetching points statistics',
      error: error.message,
    });
  }
};
