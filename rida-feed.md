# RIDA — Post/Feed Features Prompt

## Overview
Add full post interaction features to the RIDA feed:
- ❤️ **Likes** — toggle like/unlike with live count
- 💬 **Comments** — flat + threaded replies (reply to a comment)
- 🔖 **Save/Bookmark** — save posts to personal collection
- 🔗 **Share** — copy link + repost to own feed
- 🔒 **Doctors only** — all interactions restricted to doctors
- ⚡ **Real-time** — like/comment counts update live via Pusher (reuse existing setup)

---

## 1. Install Dependencies

No new packages needed — Pusher is already installed.

---

## 2. Drizzle Schema Additions

Add to `drizzle/schema.ts`:

```ts
// Likes
export const likes = pgTable("likes", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments (supports threading via parentId)
export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  content: text("content").notNull(),
  parentId: uuid("parent_id"), // null = top-level, uuid = reply to comment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Saves/Bookmarks
export const saves = pgTable("saves", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reposts (share to own feed)
export const reposts = pgTable("reposts", {
  id: uuid("id").defaultRandom().primaryKey(),
  originalPostId: uuid("original_post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

Run:
```bash
npx drizzle-kit push
```

---

## 3. API Routes

### `app/api/posts/[postId]/like/route.ts`
- **POST** — toggle like (like if not liked, unlike if already liked)
- Guard: must be a doctor
- After toggle, trigger Pusher event on channel `post-${postId}`:
  ```ts
  pusherServer.trigger(`post-${postId}`, "like-updated", {
    likeCount: newCount,
    likedBy: currentUserId,
    action: "liked" | "unliked"
  });
  ```
- Return `{ liked: boolean, likeCount: number }`

### `app/api/posts/[postId]/comments/route.ts`
- **GET** — fetch all comments for a post
  - Return top-level comments with their replies nested under `replies: []`
  - Include author name, avatar, specialty for each comment
  - Order: newest first for top-level, oldest first for replies
- **POST** — add a comment
  - Body: `{ content, parentId? }`
  - Guard: must be a doctor, content max 500 chars
  - Trigger Pusher on `post-${postId}`:
    ```ts
    pusherServer.trigger(`post-${postId}`, "new-comment", { comment });
    ```
  - Return new comment object

### `app/api/posts/[postId]/comments/[commentId]/route.ts`
- **DELETE** — delete own comment only
- **PATCH** — edit own comment (body: `{ content }`)

### `app/api/posts/[postId]/save/route.ts`
- **POST** — toggle save/unsave
- Guard: must be a doctor
- Return `{ saved: boolean }`

### `app/api/posts/[postId]/share/route.ts`
- **POST** — repost to own feed
  - Body: `{ type: "repost" | "copy-link" }`
  - For repost: insert into `reposts` table, show on sharer's feed
  - For copy-link: just return `{ url: "/posts/${postId}" }` (frontend copies it)
- Guard: must be a doctor, cannot repost own post

### `app/api/posts/saved/route.ts`
- **GET** — fetch all saved posts for the logged-in doctor
- Used for the saved posts page

---

## 4. UI Components

### Update `components/feed/PostCard.tsx`

Add an action bar below every post with 4 buttons:

```
[❤️ 24 Likes]  [💬 8 Comments]  [🔖 Save]  [🔗 Share]
```

**Like button:**
- Heart icon — outline when not liked, filled red `#ef4444` when liked
- Animate on click: quick scale-up bounce (scale 1.3 → 1.0, 200ms)
- Show count next to icon
- Optimistic update — update count instantly, sync with server response

**Comment button:**
- Chat bubble icon
- Click → expands comment section below the post (accordion style)
- Show comment count

**Save button:**
- Bookmark icon — outline when unsaved, filled `#2d6a4f` when saved
- Tooltip: "Save post" / "Saved"
- No count shown

**Share button:**
- Share icon → opens a small dropdown with two options:
  - "📋 Copy link" → copies URL to clipboard, shows "Copied!" toast
  - "🔁 Repost to feed" → confirms and reposts

---

### New `components/feed/CommentSection.tsx`

Expandable comment section that appears below a post when comment button is clicked:

**Layout:**
```
─────────────────────────────────────
  [Avatar] Add a comment...   [Post]
─────────────────────────────────────
  [Avatar] Dr. Ahmed Hassan          2h ago
           Great case study! The...
           [👍 3]  [Reply]  [Edit] [Delete]

           └─ [Avatar] Dr. Sara Ali   1h ago
                       Thank you! I think...
                       [👍 1]  [Reply]

  [Avatar] Dr. James Patel          4h ago
           Have you considered...
           [👍 7]  [Reply]
─────────────────────────────────────
  [Load more comments]
```

**Features:**
- Comment input at top — auto-focus when section opens
- Submit on `Ctrl+Enter`, button click
- Each comment shows: avatar, name, specialty, time (relative), content
- **Reply button** — clicking opens an inline reply input indented under that comment
- Replies are indented with a left border `border-l-2 border-[#e5ddd0]`
- Max 2 levels deep (comment → reply, no reply-to-reply)
- **Edit** — only shown on own comments, inline edit mode
- **Delete** — only shown on own comments, confirm before delete
- Like a comment — small thumbs up with count
- "Load more" if > 10 comments

### New `components/feed/ShareDropdown.tsx`
- Small popover dropdown on share button click
- Two options: Copy Link, Repost to Feed
- Close on outside click
- "Copied!" feedback for 2 seconds after copy

### New `app/saved/page.tsx`
- Grid of saved posts (same PostCard component)
- "No saved posts yet" empty state
- Accessible from navbar or profile menu

---

## 5. Real-time Updates (Pusher)

Create `hooks/usePost.ts`:

```ts
import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher";

export function usePost(postId: string, callbacks: {
  onLikeUpdated: (data: { likeCount: number; likedBy: string; action: string }) => void;
  onNewComment: (comment: Comment) => void;
}) {
  useEffect(() => {
    const channel = pusherClient.subscribe(`post-${postId}`);
    channel.bind("like-updated", callbacks.onLikeUpdated);
    channel.bind("new-comment", callbacks.onNewComment);
    return () => {
      pusherClient.unsubscribe(`post-${postId}`);
    };
  }, [postId]);
}
```

Use this hook in `PostCard.tsx` so:
- Like count updates live for all viewers of that post
- New comments appear instantly without refresh

---

## 6. Feed Updates

### Reposts on Feed
- When a doctor reposts, it appears on their followers' feeds as:
  ```
  🔁 Dr. Ahmed Hassan reposted
  ─────────────────────────
  [Original post card]
  ```
- Repost card has a subtle top banner with the resharer's name

### Feed Query Update
In `app/api/feed/route.ts`, update the feed query to also include reposts from connected doctors, ordered by `createdAt` desc.

---

## 7. Post Count Updates

Update the `posts` table to store denormalized counts for performance:
```ts
// Add to posts table in schema
likeCount: integer("like_count").default(0),
commentCount: integer("comment_count").default(0),
saveCount: integer("save_count").default(0),
repostCount: integer("repost_count").default(0),
```

Increment/decrement these counts in the respective API routes alongside the actual like/comment/save/repost insert/delete.

---

## 8. Toast Notifications

Add a lightweight toast for user feedback. Use `sonner` (already likely installed with shadcn):

```ts
import { toast } from "sonner";

// Examples
toast.success("Post saved!");
toast.success("Link copied!");
toast.success("Reposted to your feed!");
toast.error("You can only repost others' posts");
```

If `sonner` is not installed:
```bash
npm install sonner
```

Add `<Toaster />` to `app/layout.tsx`.

---

## 9. Design Spec

Match existing RIDA design system:

| Token | Value |
|---|---|
| Background | `#f2ede3` |
| Card bg | `#faf6ef` |
| Primary green | `#2d6a4f` |
| Border | `#e5ddd0` |
| Like red | `#ef4444` |
| Save green | `#2d6a4f` |
| Text secondary | `#6b7280` |

**Action bar**: `border-t border-[#e5ddd0]` separating post content from actions
**Comment section**: `bg-[#f2ede3]` background, `border-t border-[#e5ddd0]`
**Reply indent**: `border-l-2 border-[#e5ddd0] ml-8 pl-4`
**Like animation**: `transform scale-125` for 200ms on click

---

## 10. Cursor Instructions

Paste this into Cursor chat with this file attached:

```
Build the complete post/feed interaction features for RIDA following @rida-feed.md exactly.

Steps:
1. Add likes, comments, saves, reposts tables to drizzle/schema.ts and run push
2. Build all 6 API routes (like toggle, comments CRUD, save toggle, share/repost, saved posts)
3. Update PostCard.tsx with action bar (like, comment, save, share buttons)
4. Build CommentSection.tsx with flat + threaded replies
5. Build ShareDropdown.tsx with copy link + repost options
6. Build usePost.ts hook for real-time Pusher updates
7. Build /saved page for bookmarked posts
8. Add repost display to feed
9. Add sonner toasts for all actions
10. All interactions restricted to doctors only

Do not touch auth, messaging, onboarding, search, or any existing functionality.
```

---

## 11. After Building — Test Checklist

- [ ] Like button toggles — count updates live across tabs
- [ ] Heart animates on click
- [ ] Comment section expands on click
- [ ] Can post a top-level comment
- [ ] Can reply to a comment (indented)
- [ ] Can edit and delete own comments
- [ ] Cannot edit/delete others' comments
- [ ] Save button toggles — post appears in `/saved`
- [ ] Copy link copies correct URL + shows "Copied!" toast
- [ ] Repost appears on feed with "🔁 reposted" banner
- [ ] Cannot repost own post
- [ ] New comments appear in real-time across tabs
- [ ] Like counts update in real-time across tabs
- [ ] Non-doctors cannot interact (guard returns 403)
