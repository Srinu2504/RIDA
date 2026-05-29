export function truncatePostPreview(body: string, max = 72) {
  const text = body.trim().replace(/\s+/g, " ");
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function formatPostEngagement(likeCount: number, commentCount: number) {
  const likes = Number(likeCount ?? 0);
  const comments = Number(commentCount ?? 0);
  const total = likes + comments;
  const parts: string[] = [];
  if (likes > 0) parts.push(`${likes} like${likes === 1 ? "" : "s"}`);
  if (comments > 0) parts.push(`${comments} comment${comments === 1 ? "" : "s"}`);
  if (parts.length === 0) return "No engagement yet";
  return parts.join(" · ");
}

export function relativeTimeShort(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function trendingTagLabel(tag: string) {
  switch (tag) {
    case "Case Study":
      return "Case study";
    case "Photo":
      return "Photo";
    case "Article":
      return "Article";
    default:
      return tag;
  }
}
