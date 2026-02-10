import mongoose from 'mongoose';
import QRCode from '../src/models/qrCode.model';
import dotenv from 'dotenv';

dotenv.config();

// Old database connection (source)
const OLD_MONGO_URI = process.env.OLD_MONGO_URI || 'mongodb://localhost:27017/old-database';
// New database connection (destination)
const NEW_MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/deputy-beer-campaign';

async function migrateQRCodes() {
  try {
    // Connect to old database
    const oldConnection = await mongoose.createConnection(OLD_MONGO_URI);
    console.log('✓ Connected to old database');

    // Connect to new database
    await mongoose.connect(NEW_MONGO_URI);
    console.log('✓ Connected to new database');

    // Define old QR code schema (adjust collection name if needed)
    const OldQRCodeSchema = new mongoose.Schema({}, { strict: false });
    // Try common collection names: 'qrcodes', 'qrcode', 'QRCode', 'qr_codes'
    const collectionName = 'qrcodes'; // Change this to your actual collection name
    const OldQRCode = oldConnection.model('QRCode', OldQRCodeSchema, collectionName);

    // Fetch all QR codes from old database
    const oldQRCodes = await OldQRCode.find({});
    console.log(`\nFound ${oldQRCodes.length} QR codes in old database`);

    if (oldQRCodes.length === 0) {
      console.log('No QR codes to migrate');
      await oldConnection.close();
      await mongoose.disconnect();
      return;
    }

    // Migrate each QR code
    let migrated = 0;
    let skipped = 0;

    for (const oldCode of oldQRCodes) {
      try {
        // Cast to any to access dynamic properties
        const oldCodeData: any = oldCode.toObject ? oldCode.toObject() : oldCode;
        
        // Map old schema to new schema (based on your old structure)
        const codeValue = oldCodeData.code || String(oldCodeData._id || '');
        const newQRCode = {
          code: codeValue,
          codeUrl: oldCodeData.codeUrl || undefined,
          points: oldCodeData.points || 30, // Default 30 points per scan
          isUsed: oldCodeData.isUsed || false,
          usedBy: oldCodeData.claimedBy || oldCodeData.usedBy || undefined,
          usedAt: oldCodeData.claimedAt || oldCodeData.usedAt || undefined,
          entryId: oldCodeData.entryId || undefined,
          brand: oldCodeData.brand || undefined,
        };

        if (!newQRCode.code) {
          console.log(`⚠ Skipped (no code found): ${JSON.stringify(oldCodeData)}`);
          skipped++;
          continue;
        }

        // Check if code already exists
        const exists = await QRCode.findOne({ code: newQRCode.code });
        if (exists) {
          console.log(`⚠ Skipped (already exists): ${newQRCode.code}`);
          skipped++;
          continue;
        }

        // Insert into new database
        await QRCode.create(newQRCode);
        migrated++;
        console.log(`✓ Migrated: ${newQRCode.code}`);
      } catch (error: any) {
        const oldCodeData: any = oldCode.toObject ? oldCode.toObject() : oldCode;
        const codeValue = oldCodeData?.code || oldCodeData?.qrCode || oldCodeData?._id || 'unknown';
        console.error(`✗ Error migrating code ${codeValue}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n✓ Migration complete!`);
    console.log(`  Migrated: ${migrated}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Total: ${oldQRCodes.length}`);

    await oldConnection.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateQRCodes();
