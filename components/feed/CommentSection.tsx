"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconThumbUp } from "@tabler/icons-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";

interface CommentItem {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  authorName: string;
  avatar: string | null;
  specialty: string | null;
  replies: CommentItem[];
}

function relativeTime(input?: string) {
  if (!input) return "";
  const d = new Date(input);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CommentSection({
  postId,
  currentUserId,
  onCommentCountDelta,
  incomingComment,
}: {
  postId: string;
  currentUserId: string;
  onCommentCountDelta: (delta: number) => void;
  incomingComment?: CommentItem | null;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [limit, setLimit] = useState(10);

  const load = useCallback(async () => {
    const res = await fetch(`/api/posts/${postId}/comments`);
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to load comments");
      return;
    }
    setComments(json.comments);
  }, [postId]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!incomingComment) return;
    setComments((prev) => {
      if (incomingComment.parentId) {
        return prev.map((c) =>
          c.id === incomingComment.parentId
            ? { ...c, replies: [...c.replies, incomingComment] }
            : c
        );
      }
      return [incomingComment, ...prev];
    });
  }, [incomingComment]);

  const visible = useMemo(() => comments.slice(0, limit), [comments, limit]);

  const submit = async () => {
    if (!text.trim()) return;
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim() }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to add comment");
      return;
    }
    toast.success("Comment posted");
    setText("");
    onCommentCountDelta(1);
    setComments((prev) => [json.comment, ...prev]);
  };

  const submitReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: replyText.trim(), parentId }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to add reply");
      return;
    }
    toast.success("Reply posted");
    onCommentCountDelta(1);
    setReplyText("");
    setReplyingTo(null);
    setComments((prev) =>
      prev.map((c) => (c.id === parentId ? { ...c, replies: [...c.replies, json.comment] } : c))
    );
  };

  const remove = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to delete comment");
      return;
    }
    toast.success("Comment deleted");
    await load();
    onCommentCountDelta(-1);
  };

  const saveEdit = async (commentId: string) => {
    const content = editText.trim();
    if (!content) return;
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to update comment");
      return;
    }
    toast.success("Comment updated");
    setEditing(null);
    await load();
  };

  return (
    <div className="border-t border-[#e5ddd0] bg-[#f2ede3] px-3.5 py-3">
      <div className="flex items-start gap-2">
        <UserAvatar name="You" size={28} />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            placeholder="Add a comment..."
            className="rida-input min-h-[66px] w-full resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>
        <button type="button" className="rida-btn-primary h-9 px-4" onClick={submit}>
          Post
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {visible.map((c) => (
          <div key={c.id}>
            <CommentRow
              comment={c}
              currentUserId={currentUserId}
              editing={editing}
              editText={editText}
              setEditing={setEditing}
              setEditText={setEditText}
              onSaveEdit={saveEdit}
              onDelete={remove}
              onReply={setReplyingTo}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              submitReply={submitReply}
            />
            {c.replies.length > 0 && (
              <div className="ml-8 mt-2 space-y-2 border-l-2 border-[#e5ddd0] pl-4">
                {c.replies.map((r) => (
                  <CommentRow
                    key={r.id}
                    comment={r}
                    currentUserId={currentUserId}
                    editing={editing}
                    editText={editText}
                    setEditing={setEditing}
                    setEditText={setEditText}
                    onSaveEdit={saveEdit}
                    onDelete={remove}
                    onReply={() => {}}
                    replyingTo={null}
                    replyText=""
                    setReplyText={() => {}}
                    submitReply={() => {}}
                    isReply
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {comments.length > limit && (
        <button
          type="button"
          className="mt-3 text-xs font-semibold text-green-primary"
          onClick={() => setLimit((x) => x + 10)}
        >
          Load more comments
        </button>
      )}
    </div>
  );
}

function CommentRow({
  comment,
  currentUserId,
  editing,
  editText,
  setEditing,
  setEditText,
  onSaveEdit,
  onDelete,
  onReply,
  replyingTo,
  replyText,
  setReplyText,
  submitReply,
  isReply = false,
}: {
  comment: CommentItem;
  currentUserId: string;
  editing: string | null;
  editText: string;
  setEditing: (id: string | null) => void;
  setEditText: (v: string) => void;
  onSaveEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string | null) => void;
  replyingTo: string | null;
  replyText: string;
  setReplyText: (v: string) => void;
  submitReply: (parentId: string) => void;
  isReply?: boolean;
}) {
  const own = comment.authorId === currentUserId;
  return (
    <div className="flex gap-2">
      <UserAvatar name={comment.authorName} src={comment.avatar} size={26} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-text-dark">
          {comment.authorName}
          {comment.specialty ? (
            <span className="ml-1 font-medium text-text-muted">· {comment.specialty}</span>
          ) : null}
          <span className="ml-2 font-medium text-text-faint">{relativeTime(comment.createdAt)}</span>
        </p>

        {editing === comment.id ? (
          <div className="mt-1 flex gap-2">
            <input
              className="rida-input h-8 flex-1"
              value={editText}
              onChange={(e) => setEditText(e.target.value.slice(0, 500))}
            />
            <button className="text-xs font-semibold text-green-primary" onClick={() => onSaveEdit(comment.id)}>
              Save
            </button>
          </div>
        ) : (
          <p className="mt-0.5 text-xs text-text-mid">{comment.content}</p>
        )}

        <div className="mt-1 flex items-center gap-3 text-[11px] text-text-muted">
          <button type="button" className="inline-flex items-center gap-1 hover:text-green-primary">
            <IconThumbUp size={12} />
            0
          </button>
          {!isReply && (
            <button type="button" className="hover:text-green-primary" onClick={() => onReply(comment.id)}>
              Reply
            </button>
          )}
          {own && (
            <>
              <button
                type="button"
                className="hover:text-green-primary"
                onClick={() => {
                  setEditing(comment.id);
                  setEditText(comment.content);
                }}
              >
                Edit
              </button>
              <button type="button" className="hover:text-green-primary" onClick={() => onDelete(comment.id)}>
                Delete
              </button>
            </>
          )}
        </div>

        {replyingTo === comment.id && (
          <div className="mt-2 flex gap-2">
            <input
              className="rida-input h-8 flex-1"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value.slice(0, 500))}
            />
            <button className="text-xs font-semibold text-green-primary" onClick={() => submitReply(comment.id)}>
              Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

