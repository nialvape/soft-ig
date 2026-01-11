# Deployment Guide: Vercel + VPS

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│   Vercel        │         │   VPS (Backend)  │
│   (Frontend)    │────────▶│   Self-hosted    │
│                 │  HTTPS  │                  │
│ - Next.js Pages │         │ - Playwright     │
│ - Static Assets │         │ - Scraper Jobs   │
│ - Auth Routes   │         │ - Bull/Redis     │
└─────────────────┘         └──────────────────┘
        │                            │
        │                            │
        ▼                            ▼
   Supabase                    PostgreSQL
  (Database)                   (Same DB)
```

## Option 1: Separate Backend Service (Recommended)

### Step 1: Create Backend Service

Create a new file `backend/server.js`:

```javascript
// Standalone Express server for Playwright scraping
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Import your scraper functions
const { loginToInstagram } = require('../src/lib/scraper/instagram-login');

app.post('/api/instagram/connect', async (req, res) => {
  // Your Playwright login logic here
});

app.post('/api/scraper/stories', async (req, res) => {
  // Story scraping logic
});

app.listen(4000, () => {
  console.log('Backend running on port 4000');
});
```

### Step 2: Deploy to Vercel

1. **Update `next.config.js`** to disable Playwright routes:

```javascript
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Disable Playwright routes on Vercel
  async rewrites() {
    if (process.env.VERCEL) {
      return [
        {
          source: '/api/instagram/:path*',
          destination: process.env.BACKEND_API_URL + '/api/instagram/:path*',
        },
        {
          source: '/api/scraper/:path*',
          destination: process.env.BACKEND_API_URL + '/api/scraper/:path*',
        },
      ];
    }
    return [];
  },
});
```

2. **Deploy to Vercel:**
```bash
vercel deploy
```

3. **Set Environment Variables in Vercel:**
```
DATABASE_URL=<supabase-url>
REDIS_URL=<upstash-redis-url>
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<secret>
BACKEND_API_URL=https://your-vps-ip:4000
BACKEND_API_SECRET=<secret>
```

### Step 3: Deploy Backend to VPS

1. **SSH into your VPS:**
```bash
ssh user@your-vps-ip
```

2. **Clone repository:**
```bash
git clone <your-repo>
cd soft-ig
npm install
npx playwright install chromium
```

3. **Create `.env` for backend:**
```bash
DATABASE_URL=<same-as-vercel>
REDIS_URL=<same-as-vercel>
ENCRYPTION_KEY=<same-as-vercel>
PORT=4000
```

4. **Run backend with PM2:**
```bash
npm install -g pm2
pm2 start backend/server.js --name soft-ig-backend
pm2 save
pm2 startup
```

5. **Setup Nginx reverse proxy:**
```nginx
server {
    listen 443 ssl;
    server_name api.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Option 2: Monorepo with Conditional Routes

### Keep everything in one codebase

**Vercel Deployment:**
- Set `DISABLE_PLAYWRIGHT=true` in Vercel env vars
- Playwright routes return 503 or redirect to VPS

**VPS Deployment:**
- Run full Next.js app: `npm run build && npm start`
- All features enabled

**Update API routes:**
```typescript
// src/app/api/instagram/connect/route.ts
export async function POST(request: Request) {
  if (process.env.DISABLE_PLAYWRIGHT === 'true') {
    return NextResponse.json(
      { error: 'This endpoint is only available on the backend server' },
      { status: 503 }
    );
  }
  
  // Normal Playwright logic...
}
```

---

## Recommended: Option 1

**Why?**
- ✅ Vercel handles frontend scaling automatically
- ✅ VPS has full control over Playwright/scraping
- ✅ Cleaner separation of concerns
- ✅ Easier to debug and monitor
- ✅ Can restart backend without affecting frontend

**Database:**
- Use Supabase (PostgreSQL) - accessible from both Vercel and VPS
- Or use VPS PostgreSQL with public IP (secure with SSL)

**Redis:**
- Use Upstash (serverless Redis) - accessible from both
- Or use VPS Redis with public IP

---

## Quick Start Commands

### Development (Current)
```bash
npm run dev  # Everything on localhost:3000
```

### Production - Vercel
```bash
vercel deploy --prod
```

### Production - VPS Backend
```bash
pm2 start npm --name "soft-ig-backend" -- start
```

---

## Environment Variables Summary

### Vercel (.env.production)
```
DATABASE_URL=<supabase>
REDIS_URL=<upstash>
NEXTAUTH_URL=https://soft-ig.vercel.app
NEXTAUTH_SECRET=<secret>
BACKEND_API_URL=https://api.your-domain.com
ENCRYPTION_KEY=<same-as-backend>
```

### VPS (.env)
```
DATABASE_URL=<same-as-vercel>
REDIS_URL=<same-as-vercel>
ENCRYPTION_KEY=<same-as-vercel>
PORT=4000
FRONTEND_URL=https://soft-ig.vercel.app
```

---

## Testing the Setup

1. **Frontend (Vercel):** https://soft-ig.vercel.app
2. **Backend (VPS):** https://api.your-domain.com/health
3. **Database:** Both connect to same Supabase instance
4. **Flow:** User clicks "Connect Instagram" → Vercel proxies to VPS → VPS runs Playwright → Saves to shared DB

This setup gives you the best of both worlds: Vercel's CDN/scaling for frontend + full control over Playwright on your VPS!
