import mongoose from 'mongoose';
import QRCode from '../src/models/qrCode.model';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

// Support both MONGO_URI and MONGODB_URI for compatibility
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/deputy-beer-campaign';

console.log('MongoDB URI:', MONGO_URI ? `${MONGO_URI.substring(0, 20)}...` : 'Not found');

interface CSVRow {
  code: string;
  points?: number;
  brand?: string;
}

async function importQRCodesFromCSV(csvFilePath: string) {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Read CSV file
    const fileStream = fs.createReadStream(csvFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    const qrCodes: Array<{ code: string; codeUrl?: string; points: number; brand?: string }> = [];
    let lineNumber = 0;
    let duplicateCount = 0;
    const existingCodes = new Set<string>();

    console.log('📖 Reading CSV file...\n');

    // Parse CSV - only process valid URLs
    for await (const line of rl) {
      lineNumber++;
      
      // Skip header row
      if (lineNumber === 1) continue;
      
      // Skip empty lines
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Only process lines that start with http:// or https://
      if (!trimmedLine.startsWith('http://') && !trimmedLine.startsWith('https://')) {
        continue; // Skip invalid lines
      }

      // Show progress every 1000 valid URLs
      if (qrCodes.length > 0 && qrCodes.length % 1000 === 0) {
        process.stdout.write(`\r📊 Processed ${lineNumber.toLocaleString()} lines | Valid URLs: ${qrCodes.length.toLocaleString()} | Duplicates: ${duplicateCount.toLocaleString()}`);
      }

      const columns = trimmedLine.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      let codeUrl = columns[0];

      if (!codeUrl || (!codeUrl.startsWith('http://') && !codeUrl.startsWith('https://'))) {
        continue; // Skip if not a valid URL
      }

      // Extract last 6 characters from URL (remove trailing slash if present)
      const cleanUrl = codeUrl.replace(/\/$/, ''); // Remove trailing slash
      let code = cleanUrl.slice(-6); // Get last 6 characters
      
      // If code is empty or too short, use last 6 chars of URL hash
      if (!code || code.length < 6) {
        const crypto = require('crypto');
        code = crypto.createHash('md5').update(codeUrl).digest('hex').slice(-6).toUpperCase();
      }

      // Check for duplicates
      if (existingCodes.has(code)) {
        duplicateCount++;
        continue;
      }

      existingCodes.add(code);

      const points = columns[1] ? parseInt(columns[1], 10) || 30 : 30;
      const brand = columns[2] || undefined;

      qrCodes.push({
        code,
        codeUrl,
        points,
        brand
      });
    }

    // Clear the progress line and show final reading stats
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.log(`\n✅ Finished reading CSV file`);
    console.log(`   Total lines read: ${lineNumber.toLocaleString()}`);
    console.log(`   Valid URLs found: ${qrCodes.length.toLocaleString()}`);
    console.log(`   Duplicates skipped: ${duplicateCount.toLocaleString()}\n`);

    // Insert QR codes in batches
    const batchSize = 1000;
    let inserted = 0;
    let skipped = 0;
    const totalBatches = Math.ceil(qrCodes.length / batchSize);

    console.log(`💾 Inserting ${qrCodes.length.toLocaleString()} QR codes into database...\n`);

    for (let i = 0; i < qrCodes.length; i += batchSize) {
      const batch = qrCodes.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      
      try {
        await QRCode.insertMany(batch, { ordered: false });
        inserted += batch.length;
        const percentage = ((inserted / qrCodes.length) * 100).toFixed(1);
        process.stdout.write(`\r📦 Batch ${batchNum}/${totalBatches} | Inserted: ${inserted.toLocaleString()}/${qrCodes.length.toLocaleString()} (${percentage}%)`);
      } catch (error: any) {
        // Handle duplicate key errors
        if (error.code === 11000) {
          skipped += batch.length;
          process.stdout.write(`\r⚠️  Batch ${batchNum}/${totalBatches} skipped (duplicates in DB)`);
        } else {
          throw error;
        }
      }
    }

    // Clear progress line
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.log(`\n✅ Successfully imported ${inserted.toLocaleString()} QR codes!`);
    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped.toLocaleString()} codes (already exist in database)`);
    }
    console.log(`\n🎉 Import complete!\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error importing QR codes:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get CSV file path from command line argument
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('Usage: ts-node scripts/importQRCodesFromCSV.ts <path-to-csv-file>');
  console.error('Example: ts-node scripts/importQRCodesFromCSV.ts ./qrcodes.csv');
  process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
  console.error(`Error: CSV file not found at ${csvFilePath}`);
  process.exit(1);
}

importQRCodesFromCSV(csvFilePath);
