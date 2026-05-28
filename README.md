# RIDA — Doctors Social Network

> A professional social media platform exclusively for verified doctors to connect, share knowledge, and collaborate.

🔗 **Live Demo:** [https://rida-mu.vercel.app](https://rida-mu.vercel.app)

---

## Features

### 🔐 Authentication
- Sign up with email, password and role selection
- OTP email verification (one-time, only at signup)
- Secure sign in with email + password
- Session management via NextAuth.js

### 👨‍⚕️ Doctor Onboarding
- 4-step profile wizard
- Personal info + profile photo upload
- Medical credentials & license number
- Practice/hospital details
- Contact & visibility settings

### 📰 Post Feed
- Create posts tagged as Case Study, Article, Update or Photo
- Real-time feed showing posts from connected doctors
- Repost to your own feed with attribution banner

### ❤️ Post Interactions
- Like/unlike with live count updates
- Threaded comments with replies
- Edit and delete own comments
- Save/bookmark posts to personal collection
- Share via copy link or repost

### 💬 Real-Time Messaging
- Direct messaging between connected doctors only
- Live message delivery via Pusher
- Typing indicators
- Read receipts (✓ sent / ✓✓ read)
- Unread message badge in navbar

### 🔔 Real-Time Notifications
- Instant notifications for likes, comments, replies
- Connection request and acceptance alerts
- New message notifications
- Repost notifications
- Bell icon with unread count badge
- Full notifications page with filters and date grouping

### 🔍 Search & Discovery
- Search doctors by name, specialty, hospital, city
- Filter by specialty, location, experience, gender

### 🤝 Connections
- Send, accept, and reject connection requests
- Doctors can only connect with other doctors
- Pending / Connected / Rejected states

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Auth | NextAuth.js, bcryptjs, Zod |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Neon), Drizzle ORM |
| Real-time | Pusher Channels |
| Storage | Cloudinary |
| Email | Resend |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Pusher account
- Cloudinary account
- Resend account

### Installation

```bash
# Clone the repository
git clone https://github.com/Srinu2504/RIDA.git
cd RIDA

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in all values in .env.local

# Push database schema
npx drizzle-kit push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=ap2
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=ap2
```

---

## Project Structure

```
RIDA/
├── app/
│   ├── (main)/          # Main app pages (feed, messages, notifications)
│   ├── api/             # API routes
│   ├── signin/          # Auth pages
│   ├── signup/
│   └── verify-email/
├── components/
│   ├── feed/            # Post, comment, share components
│   ├── messaging/       # Chat UI components
│   ├── notifications/   # Notification components
│   └── shared/          # Navbar, layout components
├── drizzle/
│   └── schema.ts        # Database schema
├── hooks/               # Custom React hooks
├── lib/                 # Utilities (db, pusher, notifications)
└── types/               # TypeScript types
```

---

## Deployment

This project is deployed on **Vercel** with **Neon PostgreSQL**.

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## License

MIT License — feel free to use this project as a reference or starting point.

---

Built with ❤️ by [Srinu](https://github.com/Srinu2504)
