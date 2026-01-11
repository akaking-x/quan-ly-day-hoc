# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tuition management web application for individual tutors (Vietnamese: "Quản lý học phí dạy thêm"). Single-user application for managing students, groups, attendance, and fee collection.

## Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB (local or Docker)

## Commands

```bash
# Install all dependencies (root, server, client)
npm run install:all

# Run MongoDB via Docker
docker-compose up -d

# Run development (both client and server concurrently)
npm run dev

# Run only server
npm run dev:server

# Run only client
npm run dev:client

# Build for production
npm run build
```

## Project Structure

```
tuition-management/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components (common/, layout/, students/, groups/, sessions/, payments/, dashboard/)
│       ├── pages/          # Page components
│       ├── hooks/          # Custom React hooks
│       ├── services/       # API calls
│       ├── store/          # State management (Zustand/Context)
│       ├── types/          # TypeScript types
│       └── utils/          # Helper functions
└── server/                 # Express backend
    └── src/
        ├── config/         # DB config, env config
        ├── controllers/    # Request handlers
        ├── models/         # Mongoose models
        ├── routes/         # API routes
        ├── services/       # Business logic
        ├── middleware/     # Error handling, validation
        └── utils/          # Helper functions
```

## Data Model (MongoDB Collections)

- **students**: Student info with `feePerSession`, `type` (individual/group), `groupId`, `active` status
- **groups**: Study groups with `schedule` array (dayOfWeek, startTime, endTime, subject), `defaultFeePerSession`
- **sessions**: Class sessions with `attendance` array tracking each student's status
- **payments**: Payment records linking to student, period, and sessions count
- **settings**: Key-value configuration storage

## Key Business Logic

### Fee Calculation
- Fee = number of attended sessions × `feePerSession`
- Balance = total fee owed - total payments
- Attendance statuses: `present`, `late` (charged), `absent` (configurable), `excused` (not charged)

### API Response Format
```typescript
{ success: boolean, data?: any, error?: string }
```

## Coding Conventions

- Variables/functions: camelCase
- React components: PascalCase (files: `PascalCase.tsx`)
- Other files: kebab-case.ts
- Mobile-first responsive design (breakpoints: sm:640px, md:768px, lg:1024px, xl:1280px)

## Environment Variables

```env
# Server
PORT=3001
MONGODB_URI=mongodb://localhost:27017/tuition-management
NODE_ENV=development

# Client
VITE_API_URL=http://localhost:3001/api
```

## Offline Mode (PWA)

The application supports offline functionality using IndexedDB for local data storage:

### Offline Services (`client/src/services/`)
- **offlineDb.ts**: IndexedDB wrapper for local storage (students, groups, sessions, payments, notes)
- **offlineApi.ts**: Offline-aware API wrappers that fallback to local data when offline
- **syncService.ts**: Handles data synchronization between local and server
- **offlineDownload.ts**: Downloads all app data for offline use

### Offline-Supported Pages
- ✓ Dashboard (Tổng quan) - full offline support
- ✓ Students (Học sinh) - full offline support
- ✓ Groups (Lớp học) - full offline support
- ✓ Attendance (Điểm danh) - full offline support
- ✓ Payments (Học phí) - full offline support with local calculation
- ✓ Notes (Ghi chú) - full offline support
- ~ Settings (Cài đặt) - limited (backup/restore works, database management requires network)
- ✗ Users (Người dùng) - requires network connection

### Network Status Indicator
Located in the header menu bar, shows:
- Green WiFi icon: Online
- Red crossed WiFi icon: Offline
- Yellow sync icon with badge: Pending changes to sync
- Blue spinning sync icon: Currently syncing

## Docker Deployment

### Production Deployment
```bash
# Build and run with Docker Compose
docker-compose build
docker-compose up -d

# Services exposed:
# - Client (nginx): Port 80
# - Server (API): Port 3001
# - MongoDB: Port 27017
```

### VPS Deployment
The app is deployed on VPS (103.82.39.35):
```bash
ssh root@103.82.39.35
cd /opt/quan-ly-day-hoc
git pull
docker-compose build && docker-compose up -d
```

## Recent Features

### Student Portal
- Students can view their own schedule and payment status
- Access via `/student` route
- Login using phone number

### Online Class Links
- Sessions can include online meeting links (Zoom, Google Meet, etc.)
- Students see "Join Online Class" button for upcoming sessions

### Multi-language Support
- Vietnamese (primary)
- English (Guide page has both versions)
