# Quick Start Guide

## Development Mode (Recommended)

For development, use `npm run dev` which runs TypeScript directly with ts-node:

```bash
cd deputy-beer-backend
npm run dev
```

This will:
- Run TypeScript files directly (no build needed)
- Auto-restart on file changes
- Show errors in real-time

## Production Mode

If you need to build and run in production mode:

```bash
# 1. Build TypeScript to JavaScript
npm run build

# 2. Start the compiled server
npm start
```

## First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```env
   PORT=3001
   MONGO_URI=mongodb://localhost:27017/deputy-beer-campaign
   JWT_SECRET=your-secret-key-change-this
   FRONT_END_URL=http://localhost:5173
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

3. **Start MongoDB** (if running locally)

4. **Seed QR codes** (optional, for testing):
   ```bash
   npm run seed
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## Troubleshooting

- **"Cannot find module" errors**: Make sure you ran `npm install`
- **MongoDB connection errors**: Check your `MONGO_URI` in `.env`
- **Port already in use**: Change `PORT` in `.env` or stop the process using port 3001
