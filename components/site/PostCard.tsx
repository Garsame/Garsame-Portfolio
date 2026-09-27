import { Card, CardCover } from "@/components/ui";
import type { PostCategory, PostSummary } from "@/lib/content/home";
import { cn } from "@/lib/utils";
import { PostArt } from "./icons";

/**
 * A blog post card — design/01-home.html section 11.
 *
 * `PostCardPlaceholder` renders the same layout with bracketed content, for
 * while there are no published posts. The design's three sample posts are not
 * real: showing them would publish invented dates, reading times and a "# 012"
 * that implies twelve posts exist. CLAUDE.md rule 10; DECISIONS.md D-034.
 */

const categoryLabel: Record<PostCategory, string> = {
  technology: "Technology",
  business: "Business",
  ai: "AI",
  process: "Process",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Mogadishu",
});

function Shell({
  href,
  number,
  artIndex,
  children,
}: {
  href?: string;
  number: string;
  artIndex: number;
  children: React.ReactNode;
}) {
  return (
    <Card href={href} className="h-full overflow-hidden">
      <CardCover
        height="post"
        overlay={
          <span className="absolute top-3.5 left-3.5 font-mono text-mono-meta font-semibold tracking-none text-blue">
            {number}
          </span>
        }
      >
        <PostArt index={artIndex} className="text-placeholder-line" />
      </CardCover>
      <div className="flex flex-1 flex-col gap-2.5 px-5.5 pt-5 pb-6">
        {children}
      </div>
    </Card>
  );
}

/* Colour is kept out of these so the placeholder can set its own — `cn` cannot
   override a colour already in the string (D-022). */
const categoryClass = "font-mono text-mono-chip tracking-wide uppercase";
const titleClass = "text-h4 tracking-snug";
const excerptClass = "text-small text-ink-body";
const metaClass =
  "mt-auto flex items-center gap-2.25 pt-0.5 font-mono text-mono-meta font-regular tracking-none text-muted";

import type { BlogPostSummaryView } from "@/lib/blog";

export function PostCard({
  post,
  index,
}: {
  post: BlogPostSummaryView | PostSummary;
  index: number;
}) {
  return (
    <Shell
      href={`/blog/${post.slug}`}
      number={`# ${String(post.number).padStart(3, "0")}`}
      artIndex={index}
    >
      <span className={cn(categoryClass, "text-blue")}>
        {categoryLabel[post.category]}
      </span>
      <h3 className={cn(titleClass, "text-ink")}>{post.title}</h3>
      <p className={excerptClass}>{post.excerpt}</p>
      <div className={metaClass}>
        <time dateTime={post.publishedAt}>
          {dateFormat.format(new Date(post.publishedAt))}
        </time>
        <span aria-hidden="true">·</span>
        <span>{post.readingTime} min read</span>
      </div>
    </Shell>
  );
}

export function PostCardPlaceholder({ index }: { index: number }) {
  return (
    <Shell number="# ---" artIndex={index}>
      <span className={cn(categoryClass, "text-muted")}>[ Category ]</span>
      <h3 className={cn(titleClass, "text-muted")}>[ Post title ]</h3>
      <p className={excerptClass}>
        [ The excerpt — up to 160 characters, written with the post in Phase 8.
        ]
      </p>
      <div className={metaClass}>
        <span>[ Date ]</span>
        <span aria-hidden="true">·</span>
        <span>[ n ] min read</span>
      </div>
    </Shell>
  );
}
