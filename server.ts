import app from './app';
import mongoose from 'mongoose';
import http from 'http';

const port = process.env.PORT || 3001;
// Support both MONGO_URI and MONGODB_URI for compatibility
const dbUrl = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/deputy-beer-campaign';

const server = http.createServer(app);

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log('✓ Connected to MongoDB');
    console.log(`  Database: ${dbUrl}`);

    server.listen(port, () => {
      console.log(`\n✓ Server is running at http://localhost:${port}`);
      console.log(`✓ API endpoints available at http://localhost:${port}/api`);
      console.log(`✓ Health check: http://localhost:${port}/health\n`);
    });
  })
  .catch((err: any) => {
    console.error('\n✗ Failed to connect to MongoDB');
    console.error(`  Error: ${err.message}`);
    console.error(`  Attempted to connect to: ${dbUrl}\n`);
    console.error('Please ensure:');
    console.error('  1. MongoDB is installed and running');
    console.error('  2. MongoDB service is started (or use: mongod)');
    console.error('  3. Or update MONGO_URI in .env to use MongoDB Atlas or another service\n');
    console.error('The server will not start without a database connection.\n');
    process.exit(1);
  });
