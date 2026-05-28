# RIDA — Real-Time Notifications Feature Prompt

## Overview
Add a full notifications system to RIDA:
- 🔔 Bell icon dropdown in navbar with unread count badge
- 📄 Dedicated `/notifications` page
- ⚡ Real-time delivery via Pusher (reuse existing setup)
- 6 trigger events: like, comment, reply, connection request, new message, repost

---

## 1. No New Packages Needed
Pusher, Drizzle, and Sonner are already installed.

---

## 2. Drizzle Schema Addition

Add to `drizzle/schema.ts`:

```ts
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Who receives this notification
  recipientId: text("recipient_id").notNull(),

  // Who triggered it
  actorId: text("actor_id").notNull(),

  // Type of notification
  type: text("type").notNull(), 
  // values: "like" | "comment" | "reply" | "connection_request" | 
  //         "connection_accepted" | "message" | "repost"

  // Optional references
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),

  // State
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),

  createdAt: timestamp("created_at").defaultNow(),
});
```

Run:
```bash
npx drizzle-kit push
```

---

## 3. Notification Helper

Create `lib/notifications.ts`:

```ts
import { db } from "@/lib/db";
import { notifications } from "@/drizzle/schema";
import { pusherServer } from "@/lib/pusher";

interface CreateNotificationParams {
  recipientId: string;
  actorId: string;
  type: string;
  postId?: string;
  commentId?: string;
  conversationId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  // Don't notify yourself
  if (params.recipientId === params.actorId) return;

  // Insert notification
  const [notification] = await db
    .insert(notifications)
    .values(params)
    .returning();

  // Fetch actor details for the Pusher payload
  const actor = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, params.actorId),
    with: { doctorProfile: true },
  });

  // Trigger real-time event on recipient's personal channel
  await pusherServer.trigger(
    `user-${params.recipientId}`,
    "new-notification",
    {
      notification: {
        ...notification,
        actor: {
          id: actor?.id,
          name: actor?.doctorProfile?.fullName,
          avatar: actor?.doctorProfile?.avatarUrl,
          specialty: actor?.doctorProfile?.specialty,
        },
      },
    }
  );

  return notification;
}
```

---

## 4. Trigger Notifications in Existing API Routes

Add `createNotification()` calls inside these existing routes:

### `app/api/posts/[postId]/like/route.ts`
```ts
// After inserting like:
await createNotification({
  recipientId: post.authorId,
  actorId: currentUserId,
  type: "like",
  postId,
});
```

### `app/api/posts/[postId]/comments/route.ts`
```ts
// After inserting top-level comment:
await createNotification({
  recipientId: post.authorId,
  actorId: currentUserId,
  type: "comment",
  postId,
  commentId: newComment.id,
});

// After inserting reply:
await createNotification({
  recipientId: parentComment.authorId,
  actorId: currentUserId,
  type: "reply",
  postId,
  commentId: newComment.id,
});
```

### `app/api/posts/[postId]/share/route.ts`
```ts
// After repost:
await createNotification({
  recipientId: post.authorId,
  actorId: currentUserId,
  type: "repost",
  postId,
});
```

### `app/api/connections/route.ts` (or wherever connection requests are handled)
```ts
// After sending connection request:
await createNotification({
  recipientId: targetDoctorId,
  actorId: currentUserId,
  type: "connection_request",
});

// After accepting connection request:
await createNotification({
  recipientId: requesterId,
  actorId: currentUserId,
  type: "connection_accepted",
});
```

### `app/api/messages/send/route.ts`
```ts
// After sending a message (only if conversation has no recent unread from this sender):
await createNotification({
  recipientId: otherDoctorId,
  actorId: currentUserId,
  type: "message",
  conversationId,
});
```

---

## 5. API Routes

### `app/api/notifications/route.ts`
- **GET** — fetch notifications for logged-in doctor
  - Query params: `?page=1&limit=20`
  - Join with actor's doctor profile (name, avatar, specialty)
  - Order by `createdAt` desc
  - Return: `{ notifications, unreadCount, hasMore }`

### `app/api/notifications/read/route.ts`
- **POST** body: `{ notificationId? }` 
  - If `notificationId` provided → mark single notification as read
  - If no id → mark ALL notifications as read
- Trigger Pusher event on `user-${userId}` channel:
  ```ts
  pusherServer.trigger(`user-${userId}`, "notifications-read", {
    notificationId: id | "all"
  });
  ```

### `app/api/notifications/unread-count/route.ts`
- **GET** — return `{ count: number }` of unread notifications
- Used on initial page load for navbar badge

---

## 6. Notification Text Generator

Create `lib/notification-text.ts`:

```ts
export function getNotificationText(type: string, actorName: string): string {
  const name = actorName || "Someone";
  switch (type) {
    case "like":
      return `${name} liked your post`;
    case "comment":
      return `${name} commented on your post`;
    case "reply":
      return `${name} replied to your comment`;
    case "connection_request":
      return `${name} sent you a connection request`;
    case "connection_accepted":
      return `${name} accepted your connection request`;
    case "message":
      return `${name} sent you a message`;
    case "repost":
      return `${name} reposted your post`;
    default:
      return `${name} interacted with your content`;
  }
}

export function getNotificationIcon(type: string): string {
  switch (type) {
    case "like": return "❤️";
    case "comment": return "💬";
    case "reply": return "↩️";
    case "connection_request": return "🤝";
    case "connection_accepted": return "✅";
    case "message": return "✉️";
    case "repost": return "🔁";
    default: return "🔔";
  }
}

export function getNotificationLink(notification: Notification): string {
  switch (notification.type) {
    case "like":
    case "comment":
    case "reply":
    case "repost":
      return notification.postId ? `/posts/${notification.postId}` : "/";
    case "connection_request":
    case "connection_accepted":
      return "/connections";
    case "message":
      return notification.conversationId
        ? `/messages?conversation=${notification.conversationId}`
        : "/messages";
    default:
      return "/notifications";
  }
}
```

---

## 7. UI Components

### Update `components/shared/main-nav.tsx` — Bell Icon

Add a notification bell to the navbar:

```
[🔔 3]  ← bell icon with red unread badge
```

- Bell icon (lucide-react `Bell`)
- Red badge with unread count — hidden when 0
- Click → opens `NotificationDropdown` popover
- Badge updates in real-time via Pusher

### New `components/notifications/NotificationDropdown.tsx`

Dropdown popover that opens from the bell icon:

**Layout:**
```
┌─────────────────────────────┐
│  Notifications         [Mark all read] │
├─────────────────────────────┤
│ 🔴 [Avatar] Dr. Ahmed liked  2m ago  │
│    your post                          │
├─────────────────────────────┤
│ 🔴 [Avatar] Dr. Sara commented 5m ago│
│    on your post                       │
├─────────────────────────────┤
│    [Avatar] Dr. James sent  1h ago   │
│    you a message                      │
├─────────────────────────────┤
│       View all notifications →        │
└─────────────────────────────┘
```

- Shows last 5 notifications
- Unread rows: `bg-[#f0f7f4]` left border `border-l-4 border-[#2d6a4f]`
- Read rows: `bg-[#faf6ef]` no border
- Each row: actor avatar + name, notification text, relative time
- Click on row → navigate to relevant page + mark as read
- "Mark all read" button top right
- "View all notifications →" link at bottom → `/notifications`
- Close on outside click

### New `app/(main)/notifications/page.tsx`

Full notifications page:

**Layout:**
```
┌─────────────────────────────────────┐
│  🔔 Notifications                    │
│  [All] [Unread] [Likes] [Comments]  │  ← filter tabs
│  [Mark all as read]                  │
├─────────────────────────────────────┤
│  Today                               │
│  ─────────────────────────────────  │
│  🔴 [Avatar] Dr. Ahmed liked your   │
│             post · 2m ago           │
│             [post preview snippet]  │
│                                     │
│  🔴 [Avatar] Dr. Sara commented:   │
│             "Great case study!"     │
│             on your post · 5m ago  │
│                                     │
│  Yesterday                          │
│  ─────────────────────────────────  │
│  [Avatar] Dr. James sent you a     │
│           message · 1h ago         │
└─────────────────────────────────────┘
```

**Features:**
- Filter tabs: All / Unread / Likes / Comments / Connections / Messages
- Date group separators: "Today", "Yesterday", "May 24"
- Unread indicator: green left border + subtle green tint bg
- Click notification → navigate to relevant content + mark as read
- "Mark all as read" button
- Infinite scroll / "Load more" pagination (20 per page)
- Empty state per filter: "No notifications yet" with icon

### New `hooks/useNotifications.ts`

```ts
import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher";

export function useNotifications(userId: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch initial unread count
    fetch("/api/notifications/unread-count")
      .then(r => r.json())
      .then(d => setUnreadCount(d.count));

    // Subscribe to real-time events
    const channel = pusherClient.subscribe(`user-${userId}`);

    channel.bind("new-notification", (data: { notification: Notification }) => {
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    channel.bind("notifications-read", ({ notificationId }: { notificationId: string | "all" }) => {
      if (notificationId === "all") {
        setUnreadCount(0);
      } else {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });

    return () => {
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [userId]);

  return { unreadCount, notifications, setUnreadCount, setNotifications };
}
```

---

## 8. Design Spec

Match existing RIDA design system:

| Token | Value |
|---|---|
| Background | `#f2ede3` |
| Card bg | `#faf6ef` |
| Primary green | `#2d6a4f` |
| Border | `#e5ddd0` |
| Unread tint | `#f0f7f4` |
| Unread border | `border-l-4 border-[#2d6a4f]` |
| Badge red | `#ef4444` |
| Text secondary | `#6b7280` |

Bell badge: `bg-[#ef4444]` absolute top-right of bell icon, min-width `20px`, rounded full
Unread row: `bg-[#f0f7f4] border-l-4 border-[#2d6a4f]`
Read row: `bg-[#faf6ef]`
Dropdown width: `380px`, max-height `480px`, scrollable

---

## 9. Cursor Instructions

Paste this into Cursor chat with this file attached:

```
Build the complete real-time notifications system for RIDA following @rida-notifications.md exactly.

Steps:
1. Add notifications table to drizzle/schema.ts and run push
2. Create lib/notifications.ts helper
3. Create lib/notification-text.ts for text/icon/link helpers
4. Add createNotification() calls to existing like, comment, share, connection, message API routes
5. Build 3 API routes (GET notifications, POST read, GET unread-count)
6. Build useNotifications.ts hook for Pusher subscriptions
7. Update main-nav.tsx with bell icon + real-time unread badge
8. Build NotificationDropdown.tsx (last 5, mark all read, view all link)
9. Build /notifications page (filters, date groups, pagination, mark as read)
10. Match existing RIDA color system exactly

Do not touch auth, messaging, feed interactions, onboarding, or any existing functionality.
```

---

## 10. After Building — Test Checklist

- [ ] Bell icon appears in navbar
- [ ] Unread badge shows correct count
- [ ] Like a post → author gets notification instantly (real-time)
- [ ] Comment on post → author gets notification instantly
- [ ] Reply to comment → commenter gets notification
- [ ] Repost → original author gets notification
- [ ] Send connection request → target gets notification
- [ ] Accept connection → requester gets notification
- [ ] Send message → recipient gets notification (bell badge updates)
- [ ] Click notification → navigates to correct page
- [ ] Clicking marks it as read (border/tint disappears)
- [ ] "Mark all read" clears all badges
- [ ] `/notifications` page loads with date groups
- [ ] Filter tabs work (Unread, Likes, etc.)
- [ ] No self-notifications (liking own post doesn't notify yourself)
- [ ] Real-time: open two tabs, action in Tab 2 → bell updates in Tab 1 instantly
