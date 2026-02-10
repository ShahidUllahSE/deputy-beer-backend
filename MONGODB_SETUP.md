# MongoDB Setup Guide

## Option 1: Local MongoDB (Recommended for Development)

### Windows:
1. **Install MongoDB:**
   - Download from: https://www.mongodb.com/try/download/community
   - Or use Chocolatey: `choco install mongodb`

2. **Start MongoDB Service:**
   ```powershell
   # As Administrator
   net start MongoDB
   ```
   
   Or start manually:
   ```powershell
   mongod --dbpath "C:\data\db"
   ```

3. **Verify it's running:**
   ```powershell
   mongo
   # or
   mongosh
   ```

### macOS:
```bash
# Install via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

### Linux:
```bash
# Install MongoDB
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongodb
# or
sudo service mongodb start
```

## Option 2: MongoDB Atlas (Cloud - Free Tier)

1. **Create account:** https://www.mongodb.com/cloud/atlas/register

2. **Create a cluster** (free tier available)

3. **Get connection string:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

4. **Update `.env`:**
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/deputy-beer-campaign?retryWrites=true&w=majority
   ```

## Option 3: Docker (Quick Setup)

```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Your .env should have:
MONGO_URI=mongodb://localhost:27017/deputy-beer-campaign
```

## Verify Connection

Once MongoDB is running, restart your backend:

```bash
npm run dev
```

You should see:
```
✓ Connected to MongoDB
  Database: mongodb://localhost:27017/deputy-beer-campaign
```

## Troubleshooting

- **Port 27017 already in use:** Another MongoDB instance is running
- **Access denied:** Check MongoDB authentication settings
- **Connection refused:** MongoDB service is not running
- **Windows:** Make sure MongoDB service is started in Services (services.msc)
