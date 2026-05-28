import { useEffect } from "react";
import { getPusherClient } from "@/lib/pusher";

export interface PostRealtimeComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
}

export function usePost(
  postId: string,
  callbacks: {
    onLikeUpdated: (data: { likeCount: number; likedBy: string; action: string }) => void;
    onNewComment: (comment: PostRealtimeComment) => void;
  }
) {
  useEffect(() => {
    if (!postId) return;
    const pusherClient = getPusherClient();
    if (!pusherClient) return;
    const channel = pusherClient.subscribe(`post-${postId}`);
    channel.bind("like-updated", callbacks.onLikeUpdated);
    channel.bind("new-comment", ({ comment }: { comment: PostRealtimeComment }) =>
      callbacks.onNewComment(comment)
    );
    return () => {
      pusherClient.unsubscribe(`post-${postId}`);
    };
  }, [postId]);
}

