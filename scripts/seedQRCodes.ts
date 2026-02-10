import mongoose from 'mongoose';
import QRCode from '../src/models/qrCode.model';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/deputy-beer-campaign';
const NUM_CODES = 6000;

async function seedQRCodes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Generate unique QR codes
    const qrCodes = [];
    const existingCodes = new Set<string>();

    for (let i = 0; i < NUM_CODES; i++) {
      let code: string;
      do {
        // Generate a unique code (e.g., "DB-XXXX-XXXX-XXXX")
        const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
        code = `DB-${randomPart.substring(0, 4)}-${randomPart.substring(4, 8)}-${randomPart.substring(8, 12)}`;
      } while (existingCodes.has(code));

      existingCodes.add(code);
      qrCodes.push({
        code,
        isUsed: false,
      });
    }

    // Insert QR codes in batches
    const batchSize = 100;
    for (let i = 0; i < qrCodes.length; i += batchSize) {
      const batch = qrCodes.slice(i, i + batchSize);
      await QRCode.insertMany(batch, { ordered: false });
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(qrCodes.length / batchSize)}`);
    }

    console.log(`Successfully seeded ${NUM_CODES} QR codes!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding QR codes:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedQRCodes();
