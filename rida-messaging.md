# RIDA — Real-Time Messaging Feature Prompt

## Overview
Add a fully functional real-time direct messaging system to the RIDA platform.
Only **connected doctors** can message each other.
Features: text messages, read receipts (✓ sent / ✓✓ read), typing indicators, real-time via **Pusher**.

---

## Tech Stack (additions to existing)
- **Pusher** — real-time WebSocket events (free tier: 200 connections, 200k messages/day)
- **Drizzle ORM** — new `conversations` and `messages` tables (same DB setup)
- **Next.js API Routes** — send message, mark as read, get conversations
- **Zustand** — messaging UI state (active conversation, unread counts)

---

## 1. Install Dependencies

```bash
npm install pusher pusher-js
```

---

## 2. Environment Variables

Add these to `.env.local` and Vercel dashboard:

```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster   # e.g. ap2

NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

> Get these from [pusher.com](https://pusher.com) → Create App → Channels → App Keys

---

## 3. Drizzle Schema additions

In `drizzle/schema.ts`, add these tables alongside existing ones:

```ts
import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";

// Conversations — one row per pair of connected doctors
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorOneId: text("doctor_one_id").notNull(), // always the smaller userId alphabetically
  doctorTwoId: text("doctor_two_id").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

Run migration:
```bash
npx drizzle-kit push
```

---

## 4. Pusher Server Client

Create `lib/pusher.ts`:

```ts
import Pusher from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
);
```

---

## 5. API Routes

### `app/api/conversations/route.ts`
- **GET** — fetch all conversations for the logged-in doctor, ordered by `lastMessageAt` desc
- Each conversation row should include: the other doctor's name, avatar, specialty, last message preview, unread count
- Only return conversations where both users are in each other's connections table

### `app/api/conversations/[conversationId]/messages/route.ts`
- **GET** — fetch all messages for a conversation (paginated, 50 at a time, newest first)
- Guard: only allow if the logged-in user is `doctorOneId` or `doctorTwoId`

### `app/api/messages/send/route.ts`
- **POST** body: `{ conversationId, content }`
- Insert message into DB
- Update `conversations.lastMessageAt`
- Trigger Pusher event:
  ```ts
  await pusherServer.trigger(
    `conversation-${conversationId}`,
    "new-message",
    { message } // full message object
  );
  ```
- Return the new message

### `app/api/messages/read/route.ts`
- **POST** body: `{ conversationId }`
- Mark all messages in conversation where `senderId != currentUser` as `isRead = true`, set `readAt = now()`
- Trigger Pusher event:
  ```ts
  await pusherServer.trigger(
    `conversation-${conversationId}`,
    "messages-read",
    { readBy: currentUserId }
  );
  ```

### `app/api/messages/typing/route.ts`
- **POST** body: `{ conversationId, isTyping: boolean }`
- Just triggers a Pusher event — no DB write:
  ```ts
  await pusherServer.trigger(
    `conversation-${conversationId}`,
    "typing",
    { userId: currentUserId, isTyping }
  );
  ```

### `app/api/conversations/start/route.ts`
- **POST** body: `{ targetDoctorId }`
- Check that both doctors are connected (in connections table)
- Find or create a conversation row (sort IDs alphabetically for `doctorOneId`/`doctorTwoId`)
- Return `{ conversationId }`

---

## 6. Pages & Layout

### Route: `/messages`

Split-pane layout:
```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR (existing)                                       │
├──────────────────────┬──────────────────────────────────┤
│  Conversation List   │  Active Chat Window               │
│  (left panel)        │  (right panel)                   │
│                      │                                   │
│  Search bar          │  [Doctor name + avatar header]   │
│  ──────────────      │  ──────────────────────────────  │
│  [Avatar]            │                                   │
│  Dr. Name            │    [message bubble]               │
│  last message...     │    [message bubble]               │
│  [unread badge]      │    [message bubble]               │
│                      │                                   │
│  [Avatar]            │  ⌨️ Dr. Ahmed is typing...        │
│  Dr. Name            │  ──────────────────────────────  │
│  last message...     │  [text input]  [Send button]     │
│                      │                                   │
└──────────────────────┴──────────────────────────────────┘
```

On **mobile**: show conversation list by default; tapping a conversation slides to full-screen chat.

---

## 7. UI Components to Build

### `components/messaging/ConversationList.tsx`
- Lists all conversations sorted by `lastMessageAt`
- Each row: doctor avatar, name, specialty, last message preview (truncated 40 chars), timestamp (relative: "2m ago")
- **Unread badge**: green circle with count if unread messages > 0
- Search input at top to filter by doctor name
- Active conversation highlighted with `bg-[#f2ede3]` and left border `border-l-4 border-[#2d6a4f]`

### `components/messaging/ChatWindow.tsx`
- Header: doctor avatar, name, specialty, "Connected" badge
- Message list: scrollable, newest at bottom
- Auto-scroll to bottom on new message
- **Message bubbles**:
  - Sent (right): bg `#2d6a4f`, text white, rounded `rounded-2xl rounded-br-sm`
  - Received (left): bg `#f2ede3`, text `#1a1a1a`, rounded `rounded-2xl rounded-bl-sm`
- **Read receipts** below sent messages:
  - `✓` gray = sent (not yet read)
  - `✓✓` green = read
  - Show time of read on hover
- **Typing indicator**: animated 3-dot pulse shown below last message when other doctor is typing
- Date separators between messages from different days (e.g. "Today", "Yesterday", "May 24")

### `components/messaging/MessageInput.tsx`
- Textarea (auto-resize, max 4 lines)
- Send on `Enter` (new line on `Shift+Enter`)
- Send button disabled when input is empty
- Fires typing event on keystroke (debounced 500ms), fires stop-typing after 2s of no input
- Character limit: 2000

### `components/messaging/TypingIndicator.tsx`
- Three animated dots bouncing in sequence
- Text: "Dr. [Name] is typing..."
- Fades in/out smoothly

---

## 8. Pusher Subscriptions (Client-side Hook)

Create `hooks/useConversation.ts`:

```ts
import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher";

export function useConversation(conversationId: string, callbacks: {
  onNewMessage: (msg: Message) => void;
  onMessagesRead: (readBy: string) => void;
  onTyping: (userId: string, isTyping: boolean) => void;
}) {
  useEffect(() => {
    const channel = pusherClient.subscribe(`conversation-${conversationId}`);
    channel.bind("new-message", callbacks.onNewMessage);
    channel.bind("messages-read", ({ readBy }: { readBy: string }) =>
      callbacks.onMessagesRead(readBy)
    );
    channel.bind("typing", ({ userId, isTyping }: { userId: string; isTyping: boolean }) =>
      callbacks.onTyping(userId, isTyping)
    );
    return () => {
      pusherClient.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId]);
}
```

---

## 9. Unread Count in Navbar

- Add a message icon to the navbar (existing `Navbar.tsx`)
- Show a green dot / count badge when there are unread messages
- Fetch unread count on mount from `/api/conversations` (sum of unread across all conversations)
- Update in real-time via a separate Pusher channel per user: `user-${userId}` → event `unread-update`

---

## 10. "Message" Button on Profile & Connection Cards

- On doctor profile pages and connection cards, add a **"Message"** button
- On click: call `POST /api/conversations/start` with `targetDoctorId`
- On success: redirect to `/messages?conversation=${conversationId}`
- If not connected: show tooltip "Connect with this doctor to message them"

---

## 11. Design Spec

Match the existing RIDA design system exactly:

| Token | Value |
|---|---|
| Background | `#f2ede3` |
| Card bg | `#faf6ef` |
| Primary green | `#2d6a4f` |
| Primary green hover | `#245a41` |
| Text primary | `#1a1a1a` |
| Text secondary | `#6b7280` |
| Border | `#e5ddd0` |
| Border radius | `12px` cards, `999px` pills |
| Font | Same as existing app |

Sent bubble: `#2d6a4f` bg, white text
Received bubble: `#faf6ef` bg, `#1a1a1a` text, `#e5ddd0` border
Read receipt ticks: gray `#9ca3af` (sent) → green `#2d6a4f` (read)
Typing dots: `#2d6a4f` color, 0.4s staggered bounce animation

---

## 12. Cursor Instructions

> Paste this message into Cursor chat with this file attached:

```
Build the complete real-time messaging feature for RIDA following @rida-messaging.md exactly.

Steps:
1. Install pusher and pusher-js
2. Add conversations and messages tables to drizzle/schema.ts and run push
3. Create lib/pusher.ts with server + client exports
4. Build all 5 API routes (conversations, messages, send, read, typing, start)
5. Build the /messages page with split-pane layout
6. Build all 4 UI components (ConversationList, ChatWindow, MessageInput, TypingIndicator)
7. Build useConversation hook for Pusher subscriptions
8. Add unread badge to existing Navbar
9. Add Message button to doctor profile and connection cards
10. Match the existing RIDA color system exactly — do not change any existing styles

Do not touch auth, onboarding, search, feed, or any existing functionality.
```

---

## 13. Pusher Setup (Quick Guide)

1. Go to [pusher.com](https://pusher.com) → Sign up free
2. Create App → name it `rida` → cluster `ap2` (closest to India)
3. Go to **App Keys** tab → copy all 4 values into `.env.local`
4. Go to **App Settings** → enable **"Enable client events"** (needed for typing indicators)
5. Add all 4 env vars to Vercel dashboard too

---

## 14. After Building — Test Checklist

- [ ] Two doctor accounts can open `/messages`
- [ ] Conversation starts from profile "Message" button
- [ ] Messages send and appear instantly (no page refresh)
- [ ] ✓ appears on sent message immediately
- [ ] ✓✓ appears when recipient opens the conversation
- [ ] Typing indicator appears within 500ms of keypress
- [ ] Typing indicator disappears after 2s of no typing
- [ ] Unread badge shows in navbar
- [ ] Unread badge clears when conversation is opened
- [ ] Mobile layout: list → chat transition works
- [ ] Non-connected doctors cannot message each other
