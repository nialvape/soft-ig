# Soft-IG

**Instagram Alternative for Healthier Content Consumption**

Soft-IG is a web application designed to help users quit Instagram by providing a controlled, healthier way to consume content from people they care about. The app uses a headless browser to fetch Instagram stories on behalf of users, stores multimedia content securely, and presents it in a chronological, non-addictive format.

## 🎯 Project Status

### ✅ Phase 1: Foundation Complete

- [x] Next.js 14+ with TypeScript
- [x] Prisma ORM with PostgreSQL
- [x] AES-256-GCM Encryption utilities
- [x] Docker Compose (PostgreSQL + Redis)
- [x] PWA configuration
- [x] Playwright scraper utilities
- [x] Human-like behavior implementation

### 🚀 Next Phases

- Phase 2: Authentication System (NextAuth.js v5)
- Phase 3: Playwright Scraper Implementation
- Phase 4: Background Jobs (Bull/BullMQ)
- Phase 5: Feed & UI Components
- Phase 6: PWA Features & Push Notifications

## 🏗️ Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: next-pwa
- **Authentication**: NextAuth.js v5

### Backend
- **API**: Next.js API Routes / Server Actions
- **Runtime**: Node.js
- **Browser Automation**: Playwright (headless Chromium)
- **Background Jobs**: Bull/BullMQ with Redis

### Database & Storage
- **Database**: PostgreSQL 15+ (Docker for dev, Supabase for prod)
- **ORM**: Prisma
- **Media Storage**: PostgreSQL (encrypted binary data)
- **Encryption**: AES-256-GCM

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- Docker Desktop (for PostgreSQL and Redis)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd soft-ig
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start Docker containers**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npx prisma db push
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
soft-ig/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── encryption.ts      # AES-256-GCM encryption
│   │   └── scraper/
│   │       ├── human-behavior.ts    # Anti-detection utilities
│   │       └── playwright-client.ts # Browser automation
│   └── components/            # React components
├── public/
│   └── manifest.json          # PWA manifest
├── docker-compose.yml         # PostgreSQL + Redis
├── .env.local                 # Environment variables
└── package.json
```

## 🔐 Security Features

- **AES-256-GCM Encryption**: All Instagram sessions and media files are encrypted
- **Secure Session Storage**: Encrypted cookies stored in PostgreSQL
- **Password Hashing**: bcrypt with cost factor 12+
- **Environment Variables**: Sensitive keys stored in .env.local

## 🤖 Human-Like Behavior

The Playwright scraper implements sophisticated human-like behavior to avoid Instagram detection:

- **Random Delays**: 2-5 seconds between actions
- **Realistic Mouse Movements**: Bezier curves instead of straight lines
- **Typing Simulation**: Variable speed with occasional typos
- **Session Reuse**: Minimize logins (max once per day)
- **Action Limiting**: Max 20-30 actions per session

## 📱 PWA Features

- **Installable**: Add to home screen on iOS and Android
- **Offline Support**: Service worker caching
- **Push Notifications**: Web Push API for story alerts
- **Mobile-Optimized**: Touch-friendly UI with safe area insets

## 🗄️ Database Schema

### Core Models

- **User**: Authentication and Instagram credentials
- **Session**: NextAuth.js sessions
- **FollowedAccount**: Instagram accounts to monitor (max 15 per user)
- **Story**: Encrypted Instagram stories (auto-delete after viewing)
- **Post**: Encrypted Instagram posts (for wrapped content)
- **Notification**: User notifications
- **ScraperJob**: Background job tracking

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma db push   # Push schema changes to database
```

## 🐳 Docker Commands

```bash
docker-compose up -d              # Start containers
docker-compose down               # Stop containers
docker-compose logs postgres      # View PostgreSQL logs
docker-compose logs redis         # View Redis logs
```

## 📚 Documentation

Detailed planning documents are available in the `llm/` directory:

- `implementation_plan.md` - Complete technical plan (800+ lines)
- `requirements_summary.md` - Confirmed requirements
- `human_behavior_guide.md` - Critical scraper implementation
- `pwa_implementation.md` - PWA setup and features
- `unified_feed_concept.md` - Feed design and mockups

## 🎯 Key Features

### Unified Feed
- Single chronological feed with stories AND posts
- Visual badges to differentiate content types
- Oldest-first ordering (no algorithmic sorting)

### Wrapped Content
- Daily, weekly, or monthly post aggregation
- User-configurable periodicity
- Separate from stories (which are fetched every 20h)

### 2FA Support
- Automatic detection of 2FA prompts
- UI notification for user to provide code
- Secure session persistence

### Video Compression
- FFmpeg compression for videos >10MB
- 50-70% size reduction
- Metadata tracking (original/compressed sizes)

## 🚧 Roadmap

- [x] **Phase 1**: Foundation & Setup
- [x] **Phase 2**: Authentication System
- [x] **Phase 3**: Instagram Connection & 2FA
- [ ] **Phase 4**: Playwright Scraper (Stories & Posts)
- [ ] **Phase 5**: Background Jobs
- [ ] **Phase 6**: Feed & UI
- [ ] **Phase 7**: PWA & Notifications
- [ ] **Phase 8**: Testing & Security Audit
- [ ] **Phase 9**: Deployment

## 🌐 Deployment

### Architecture

**Frontend**: Vercel (Next.js pages, static assets, auth)  
**Backend**: Self-hosted VPS (Playwright scraper, background jobs)  
**Database**: Supabase (PostgreSQL)  
**Cache**: Upstash (Redis)

### Quick Deploy

**Vercel (Frontend)**:
```bash
vercel deploy --prod
```

**VPS (Backend)**:
```bash
npm install
npx playwright install chromium
pm2 start backend/server.js --name soft-ig-backend
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

### Environment Variables

**Vercel**:
- `DATABASE_URL` - Supabase PostgreSQL URL
- `NEXTAUTH_URL` - Your Vercel app URL
- `BACKEND_API_URL` - Your VPS backend URL

**VPS**:
- `DATABASE_URL` - Same as Vercel
- `FRONTEND_URL` - Your Vercel app URL
- `PORT` - Backend port (default: 4000)

## 📄 License

This project is for educational purposes. Please respect Instagram's Terms of Service.

## ⚠️ Disclaimer

This application is designed to help users reduce their Instagram usage in a controlled manner. It is not intended to violate Instagram's Terms of Service. Use at your own risk.

---

**Built with ❤️ for healthier social media consumption**