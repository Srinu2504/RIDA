export interface NotificationLinkInput {
  type: string;
  postId?: string | null;
  conversationId?: string | null;
}

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
    case "like":
      return "❤️";
    case "comment":
      return "💬";
    case "reply":
      return "↩️";
    case "connection_request":
      return "🤝";
    case "connection_accepted":
      return "✅";
    case "message":
      return "✉️";
    case "repost":
      return "🔁";
    default:
      return "🔔";
  }
}

export function getNotificationLink(notification: NotificationLinkInput): string {
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

