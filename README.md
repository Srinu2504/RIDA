# RIDA — Doctors Social Media Platform

Professional social network for doctors built with Next.js 14, PostgreSQL, Drizzle ORM, and NextAuth.

## Features

- **Sign up** with email OTP verification (Resend) — OTP only at signup
- **Sign in** with email + password only (no OTP at login)
- **Doctor onboarding** — 4-step profile wizard with Cloudinary photo upload
- **Search** doctors by name, specialty, location, experience, gender
- **Connections** — request, accept, reject with notifications
- **Role-based access** — doctors complete profiles; patients browse and connect

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Configure PostgreSQL `DATABASE_URL` and other keys in `.env`.

3. Install dependencies and run migrations:

```bash
npm install
npm run db:generate
npm run db:migrate
```

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth flow

| Step | Behavior |
|------|----------|
| Sign up | Email + password → OTP email → verify → account created |
| Sign in | Email + password only |
| OTP | Signup only, never at login |

## Tech stack

- Next.js 14 App Router, TypeScript, Tailwind CSS
- PostgreSQL + Drizzle ORM
- NextAuth.js (credentials)
- Resend (OTP emails), Cloudinary (photos)
- shadcn/ui, Zustand, React Hook Form + Zod
