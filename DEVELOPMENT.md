# Soft-IG Development Guide

## Quick Start

### 1. Start Docker Services
```bash
docker-compose up -d
```

### 2. Initialize Database
```bash
npx prisma db push
npx prisma studio  # Optional: Open database GUI
```

### 3. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `ENCRYPTION_KEY`: 32-byte hex key for AES-256-GCM
- `NEXTAUTH_SECRET`: NextAuth.js secret
- `SCRAPER_DELAY_MIN/MAX`: Delay range for human-like behavior

## Database Management

### View Database
```bash
npx prisma studio
```

### Reset Database
```bash
npx prisma db push --force-reset
```

### Generate Prisma Client
```bash
npx prisma generate
```

## Testing Encryption

```bash
node -e "const { encrypt, decrypt } = require('./src/lib/encryption.ts'); const data = Buffer.from('test'); const encrypted = encrypt(data); const decrypted = decrypt(encrypted); console.log(decrypted.toString() === 'test' ? 'PASS' : 'FAIL');"
```

## Next Steps

1. Implement NextAuth.js authentication
2. Create login/register pages
3. Build Instagram connection flow
4. Implement Playwright scraper
5. Set up background jobs

## Useful Commands

```bash
# Install Playwright browsers
npx playwright install chromium

# Generate VAPID keys for push notifications
npx web-push generate-vapid-keys

# Build for production
npm run build

# Start production server
npm start
```
