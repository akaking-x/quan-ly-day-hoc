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
