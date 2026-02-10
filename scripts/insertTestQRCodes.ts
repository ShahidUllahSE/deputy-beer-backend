import mongoose from 'mongoose';
import QRCode from '../src/models/qrCode.model';
import dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

// Support both MONGO_URI and MONGODB_URI for compatibility
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/deputy-beer-campaign';

// Codes from the image
const codes = ['bgGHE1', 'baltuc', 'baltgf', 'ia.org'];

// Random brands
const brands = ['Deputy Beer', 'Premium Lager', 'Classic Ale', 'Special Edition', 'Limited Edition'];

// Generate random URL
function generateRandomUrl(code: string): string {
  const baseUrls = [
    'https://l.p-code.it/2/2D6X/',
    'https://deputy.beer/code/',
    'https://campaign.deputy.com/qr/',
  ];
  const baseUrl = baseUrls[Math.floor(Math.random() * baseUrls.length)];
  return `${baseUrl}${code}`;
}

// Generate random points (between 20 and 50)
function generateRandomPoints(): number {
  return Math.floor(Math.random() * 31) + 20; // 20-50
}

async function insertTestQRCodes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const inserted = [];
    const skipped = [];

    for (const code of codes) {
      try {
        // Check if code already exists
        const existing = await QRCode.findOne({ code });
        if (existing) {
          console.log(`⚠️  Code "${code}" already exists, skipping...`);
          skipped.push(code);
          continue;
        }

        // Create QR code with random data
        const qrCode = new QRCode({
          code: code,
          codeUrl: generateRandomUrl(code),
          points: generateRandomPoints(),
          brand: brands[Math.floor(Math.random() * brands.length)],
          isUsed: false,
        });

        await qrCode.save();
        console.log(`✅ Inserted: ${code} (${qrCode.points} points, ${qrCode.brand})`);
        inserted.push(code);
      } catch (error: any) {
        if (error.code === 11000) {
          console.log(`⚠️  Code "${code}" already exists (duplicate key), skipping...`);
          skipped.push(code);
        } else {
          console.error(`❌ Error inserting "${code}":`, error.message);
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Inserted: ${inserted.length}`);
    console.log(`   ⚠️  Skipped: ${skipped.length}`);
    
    if (inserted.length > 0) {
      console.log(`\n✅ Successfully inserted codes: ${inserted.join(', ')}`);
    }
    if (skipped.length > 0) {
      console.log(`⚠️  Skipped codes: ${skipped.join(', ')}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

insertTestQRCodes();
