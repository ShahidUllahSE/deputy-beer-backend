# QR Code Migration Guide

## Quick Migration

1. **Add old database URI to `.env`:**
   ```env
   OLD_MONGO_URI=mongodb://localhost:27017/old-database-name
   # OR for MongoDB Atlas:
   OLD_MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/old-database
   ```

2. **Run migration:**
   ```bash
   npm run migrate
   ```

## Customize Migration Script

If your old QR code schema is different, edit `scripts/migrateQRCodes.ts`:

1. **Update collection name** (line 20):
   ```typescript
   const OldQRCode = oldConnection.model('QRCode', OldQRCodeSchema, 'your-collection-name');
   ```

2. **Update field mapping** (line 30-35):
   ```typescript
   const newQRCode = {
     code: oldCode.yourCodeField,  // Change this
     isUsed: oldCode.yourUsedField, // Change this
     // ... etc
   };
   ```

## Example Field Mappings

**If old schema has:**
- `qrCode` → `code`
- `used` → `isUsed`
- `userId` → `usedBy`

**Update line 30-35:**
```typescript
code: oldCode.qrCode,
isUsed: oldCode.used,
usedBy: oldCode.userId,
```

## Notes

- Script skips duplicate codes (already exists in new DB)
- Shows progress for each migrated code
- Handles errors gracefully
