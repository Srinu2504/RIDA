import {
  IconHeart,
  IconMessage,
  IconPhoto,
  IconShare,
  type TablerIcon,
} from "@tabler/icons-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { MOCK_POSTS, TAG_STYLES, type MockPost } from "@/components/feed/mock-posts";

function highlightBody(body: string, terms?: string[]) {
  if (!terms?.length) return body;
  let result = body;
  terms.forEach((term) => {
    result = result.replace(
      term,
      `<strong class="font-semibold text-text-dark">${term}</strong>`
    );
  });
  return result;
}

export function PostCard({ post }: { post: MockPost }) {
  const tagStyle = TAG_STYLES[post.tag];

  return (
    <article className="rida-card overflow-hidden">
      <header className="flex items-start gap-3 px-3.5 pb-3 pt-3.5">
        <UserAvatar name={post.author} size={38} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-bold text-text-dark">
              {post.author}
            </span>
            <span
              className={`rida-tag ${tagStyle.bg} ${tagStyle.text}`}
            >
              {post.tag}
            </span>
          </div>
          <p className="text-[10px] text-text-muted">
            {post.specialty} · {post.hospital}
          </p>
        </div>
        <span className="shrink-0 text-[10px] text-text-faint">{post.time}</span>
      </header>

      <div className="px-3.5 pb-3">
        <p
          className="text-xs leading-relaxed text-text-mid"
          dangerouslySetInnerHTML={{
            __html: highlightBody(post.body, post.boldTerms),
          }}
        />
      </div>

      {post.hasImage && (
        <div className="flex h-[110px] items-center justify-center bg-green-light">
          <IconPhoto size={32} className="text-green-muted" stroke={1.5} />
        </div>
      )}

      <footer className="flex items-center justify-between border-t-[0.5px] border-cream-divider px-3.5 py-2.5">
        <div className="flex gap-4">
          <Action icon={IconHeart} label="Like" />
          <Action icon={IconMessage} label="Comment" />
          <Action icon={IconShare} label="Share" />
        </div>
        <p className="text-[10px] text-text-faint">
          {post.likes} likes · {post.comments} comments
        </p>
      </footer>
    </article>
  );
}

function Action({
  icon: Icon,
  label,
}: {
  icon: TablerIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-1 text-[11px] text-[#8a7f6e] transition-colors hover:text-green-primary"
    >
      <Icon size={15} stroke={1.5} />
      {label}
    </button>
  );
}

export function PostFeed() {
  return (
    <div className="flex flex-col gap-3.5">
      {MOCK_POSTS.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
