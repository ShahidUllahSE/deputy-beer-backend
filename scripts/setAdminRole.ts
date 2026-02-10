import mongoose from 'mongoose';
import User from '../src/models/user.model';
import dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

// Support both MONGO_URI and MONGODB_URI for compatibility
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/deputy-beer-campaign';

async function setAdminRole(email: string) {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // Update role to admin
    user.role = 'admin';
    await user.save();

    console.log(`✅ Successfully set admin role for: ${user.name} (${user.email})`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: ts-node scripts/setAdminRole.ts <email>');
  console.error('Example: ts-node scripts/setAdminRole.ts admin@example.com');
  process.exit(1);
}

setAdminRole(email);
