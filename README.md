# Deputy Beer Campaign Backend

Backend API for the Deputy Beer UTC Campaign - a contest where users submit 4 QR codes to enter for a chance to win a trip to Caribbean music festivals.

## Features

- User registration and authentication with email verification
- QR code validation
- Entry submission (4 QR codes = 1 entry)
- Entry tracking and history
- JWT-based authentication

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB (Mongoose)
- JWT for authentication
- Nodemailer for email verification

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/deputy-beer-campaign
# OR use MONGODB_URI for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/deputy-beer-campaign
JWT_SECRET=your-secret-key-change-this-in-production
FRONT_END_URL=http://localhost:5173
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

3. Start MongoDB (if running locally)

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/register` - Register a new user
  - Body: `{ name, email, password, date_of_birth, is_over_18 }`
  
- `POST /api/login` - Login user
  - Body: `{ email, password }`
  
- `GET /api/verify-email/:token` - Verify email address

### QR Codes & Entries

- `POST /api/validate` - Validate a single QR code
  - Body: `{ code }`
  
- `POST /api/submit-entry` - Submit an entry with 4 QR codes (requires auth)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ qrCodes: [string, string, string, string] }`
  
- `GET /api/entries` - Get user's entry history (requires auth)
  - Headers: `Authorization: Bearer <token>`

## Database Models

### User
- name, email, password
- date_of_birth, is_over_18
- isVerified, verificationToken
- entries_count

### QRCode
- code (unique)
- isUsed, usedBy, usedAt
- entryId

### Entry
- user (reference)
- qrCodes (array of 4 codes)
- submittedAt, weekNumber
- isWinner

## Seeding QR Codes

To seed 6,000 QR codes into the database, use the seed script:

```bash
npm run seed
```

Or create a custom script to generate and insert QR codes.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONT_END_URL` - Frontend URL for CORS and email links
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_PASS` - Gmail app password
