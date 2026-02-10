import User from '../models/user.model';
import UserHistory from '../models/userHistory.model';
import Entry from '../models/entry.model';
import QRCode from '../models/qrCode.model';

/**
 * Get all users with their statistics
 */
export const getAllUsers = async () => {
  try {
    // Get all users except admins, or all users if you want to see everyone
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password -verificationOTP -verificationOTPExpiry')
      .sort({ created_at: -1 });

    // Get statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const totalScans = await UserHistory.countDocuments({ user_id: user._id });
        const totalEntries = await Entry.countDocuments({ user: user._id });
        const totalPoints = await UserHistory.aggregate([
          { $match: { user_id: user._id } },
          { $group: { _id: null, total: { $sum: '$points_earned' } } },
        ]);

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          entries_count: user.entries_count || 0,
          points: user.points || 0,
          isVerified: user.isVerified,
          isActive: user.isActive,
          created_at: user.created_at,
          stats: {
            totalScans,
            totalEntries,
            totalPointsEarned: totalPoints[0]?.total || 0,
          },
        };
      })
    );

    return usersWithStats;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw new Error('Error fetching users');
  }
};

/**
 * Block a user
 */
export const blockUser = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.isActive = false;
    await user.save();
    return user;
  } catch (error) {
    console.error('Error blocking user:', error);
    throw new Error('Error blocking user');
  }
};

/**
 * Unblock a user
 */
export const unblockUser = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.isActive = true;
    await user.save();
    return user;
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw new Error('Error unblocking user');
  }
};

  /**
   * Delete a user
   */
  export const deleteUser = async (userId: string) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Unmark QR codes used by this user (set isUsed to false, clear usedBy, usedAt, entryId)
      await QRCode.updateMany(
        { usedBy: userId },
        {
          $set: {
            isUsed: false,
            usedBy: null,
            usedAt: null,
            entryId: null
          }
        }
      );

      // Delete user's history
      await UserHistory.deleteMany({ user_id: userId });

      // Delete user's entries
      await Entry.deleteMany({ user: userId });

      // Delete the user
      await User.findByIdAndDelete(userId);

      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Error deleting user');
    }
  };

  /**
   * Get QR code statistics
   */
  export const getQRCodeStats = async () => {
    try {
      const totalQRCodes = await QRCode.countDocuments();
      const usedQRCodes = await QRCode.countDocuments({ isUsed: true });
      const unusedQRCodes = totalQRCodes - usedQRCodes;

      return {
        totalQRCodes,
        usedQRCodes,
        unusedQRCodes,
      };
    } catch (error) {
      console.error('Error fetching QR code stats:', error);
      throw new Error('Error fetching QR code statistics');
    }
  };

/**
 * Get user's complete history (scans and entries)
 */
export const getUserHistory = async (userId: string) => {
  try {
    // Get user info first
    const user = await User.findById(userId).select('name email');
    
    const history = await UserHistory.find({ user_id: userId })
      .sort({ scannedAt: -1 })
      .populate('user_id', 'name email');

    // Group entries by entryId
    const groupedHistory: any[] = [];
    const entryGroups = new Map<string, any[]>();
    const processedEntryIds = new Set<string>();

    // Group entries
    history.forEach((item: any) => {
      if (item.type === 'Entry' && item.entryId) {
        const entryId = item.entryId.toString();
        if (!entryGroups.has(entryId)) {
          entryGroups.set(entryId, []);
        }
        entryGroups.get(entryId)!.push(item);
      }
    });

    // Build grouped history
    history.forEach((item: any) => {
      if (item.type === 'Entry' && item.entryId) {
        const entryId = item.entryId.toString();
        if (!processedEntryIds.has(entryId)) {
          const groupedItems = entryGroups.get(entryId)!;
          groupedHistory.push({
            ...groupedItems[0].toObject(),
            qrCodes: groupedItems.map((i: any) => i.qrCode),
            isGrouped: true,
          });
          processedEntryIds.add(entryId);
        }
      } else {
        groupedHistory.push(item.toObject());
      }
    });

    return {
      history: groupedHistory,
      user: user ? { name: user.name, email: user.email } : null,
    };
  } catch (error) {
    console.error('Error fetching user history:', error);
    throw new Error('Error fetching user history');
  }
};
