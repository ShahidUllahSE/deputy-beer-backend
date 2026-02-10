import mongoose from 'mongoose';
import QRCode from '../models/qrCode.model';
import User from '../models/user.model';
import Entry from '../models/entry.model';
import UserHistory from '../models/userHistory.model';

/**
 * Validate a single QR code
 * Returns QR code data if valid, null if invalid
 */
export const validateQRCode = async (code: string): Promise<any> => {
  try {
    const qrCode = await QRCode.findOne({ code });
    if (!qrCode) {
      return null;
    }
    if (qrCode.isUsed) {
      return null;
    }
    return qrCode;
  } catch (error) {
    console.error('Error validating QR code:', error);
    throw new Error('Error validating QR code');
  }
};

/**
 * Scan a single QR code and award points to user
 * Tracks which user scanned which QR code
 */
export const scanQRCode = async (
  userId: string,
  code: string
): Promise<{ qrCode: any; user: any; pointsEarned: number; history: any }> => {
  try {
    // Find QR code
    const qrCode = await QRCode.findOne({ code });
    if (!qrCode) {
      throw new Error('QR Code not found');
    }

    if (qrCode.isUsed) {
      throw new Error('QR Code has already been used');
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already scanned this code (prevent duplicate scans)
    const existingHistory = await UserHistory.findOne({
      user_id: userId,
      qrCode: code,
    });
    if (existingHistory) {
      throw new Error('You have already scanned this QR code');
    }

    const pointsEarned = qrCode.points || 30;

    // Add points to user
    user.points = (user.points || 0) + pointsEarned;
    await user.save();

    // Mark QR code as used
    qrCode.isUsed = true;
    qrCode.usedBy = userId as any;
    qrCode.usedAt = new Date();
    await qrCode.save();

    // Create history record
    const history = new UserHistory({
      user_id: userId,
      qrCode: code,
      points_earned: pointsEarned,
      points_used: 0,
      reference_id: qrCode._id.toString(),
      type: 'QRCodeScan',
      scannedAt: new Date(),
    });
    await history.save();

    return {
      qrCode,
      user,
      pointsEarned,
      history,
    };
  } catch (error: any) {
    console.error('Error scanning QR code:', error);
    throw new Error(error.message || 'Error scanning QR code');
  }
};

/**
 * Submit an entry with 4 QR codes
 * Validates all codes, marks them as used, creates entry, and increments user's entry count
 */
export const submitEntry = async (
  userId: string,
  qrCodes: string[]
): Promise<{ entry: any; message: string }> => {
  try {
    // Validate that exactly 4 QR codes are provided
    if (!qrCodes || qrCodes.length !== 4) {
      throw new Error('Exactly 4 QR codes are required for an entry');
    }

    // Check for duplicate codes
    const uniqueCodes = new Set(qrCodes);
    if (uniqueCodes.size !== 4) {
      throw new Error('Duplicate QR codes are not allowed');
    }

    // Validate all QR codes exist and are not used
    const qrCodeDocs = await QRCode.find({ code: { $in: qrCodes } });
    
    if (qrCodeDocs.length !== 4) {
      throw new Error('One or more QR codes are invalid');
    }

    // Check if any code is already used
    const usedCodes = qrCodeDocs.filter((qr) => qr.isUsed);
    if (usedCodes.length > 0) {
      throw new Error('One or more QR codes have already been used');
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate week number (week since campaign start or current week)
    const campaignStartDate = new Date('2024-01-01'); // Adjust this date as needed
    const currentDate = new Date();
    const weekNumber = Math.floor(
      (currentDate.getTime() - campaignStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    ) + 1;

    // Create entry
    const entry = new Entry({
      user: userId,
      qrCodes: qrCodes,
      weekNumber: weekNumber,
    });

    await entry.save();

    // Mark all QR codes as used
    const updatePromises = qrCodeDocs.map((qr) => {
      qr.isUsed = true;
      qr.usedBy = userId as any;
      qr.usedAt = new Date();
      qr.entryId = entry._id as any;
      return qr.save();
    });

    await Promise.all(updatePromises);

    // Create user history records for each QR code in the entry
    const historyPromises = qrCodeDocs.map((qr) => {
      const history = new UserHistory({
        user_id: userId,
        qrCode: qr.code,
        points_earned: 0, // Entry QR codes don't award points, only entries count
        points_used: 0,
        reference_id: qr._id.toString(),
        type: 'Entry',
        scannedAt: new Date(),
        entryId: entry._id.toString(),
      });
      return history.save();
    });

    await Promise.all(historyPromises);

    // Increment user's entry count
    user.entries_count = (user.entries_count || 0) + 1;
    await user.save();

    return {
      entry: {
        _id: entry._id,
        qrCodes: entry.qrCodes,
        submittedAt: entry.submittedAt,
        weekNumber: entry.weekNumber,
      },
      message: 'Entry submitted successfully! Good luck!',
    };
  } catch (error: any) {
    console.error('Error submitting entry:', error);
    throw new Error(error.message || 'Error submitting entry');
  }
};

/**
 * Get user's entry history
 */
export const getUserEntries = async (userId: string) => {
  try {
    const entries = await Entry.find({ user: userId }).sort({ submittedAt: -1 });
    return entries;
  } catch (error) {
    console.error('Error fetching user entries:', error);
    throw new Error('Error fetching entries');
  }
};

/**
 * Get user's scan history (which QR codes they scanned)
 */
export const getUserScanHistory = async (userId: string) => {
  try {
    const history = await UserHistory.find({ user_id: userId })
      .sort({ scannedAt: -1 })
      .populate('user_id', 'name email');
    return history;
  } catch (error) {
    console.error('Error fetching user scan history:', error);
    throw new Error('Error fetching scan history');
  }
};

/**
 * Get user's total points and statistics
 */
export const getUserPointsStats = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const totalScans = await UserHistory.countDocuments({ user_id: userId });
    const totalPointsEarned = await UserHistory.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$points_earned' } } },
    ]);

    return {
      currentPoints: user.points || 0,
      totalScans,
      totalPointsEarned: totalPointsEarned[0]?.total || 0,
      entriesCount: user.entries_count || 0,
    };
  } catch (error) {
    console.error('Error fetching user points stats:', error);
    throw new Error('Error fetching points statistics');
  }
};
