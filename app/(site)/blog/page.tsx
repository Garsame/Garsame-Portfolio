import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/site/Section";
import { CoverImage } from "@/components/site/CoverImage";
import { PostArt } from "@/components/site/icons";
import { Reveal } from "@/components/site/Reveal";
import {
  getCategoryCounts,
  getFeaturedPost,
  getPublishedPosts,
} from "@/lib/blog";
import {
  POST_CATEGORIES,
  POST_CATEGORY_LABELS,
  type PostCategory,
} from "@/lib/blog-rules";
import { BlogMembershipBox } from "@/components/site/blog/BlogMembershipBox";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on technology, business and building software in Somalia — written to be read, not to be skimmed.",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Mogadishu",
});

type Props = { searchParams: Promise<{ category?: string }> };

export default async function BlogPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const activeCategory =
    category && POST_CATEGORIES.includes(category as PostCategory)
      ? (category as PostCategory)
      : undefined;

  const [posts, featuredPost, categoryCounts] = await Promise.all([
    getPublishedPosts(activeCategory),
    getFeaturedPost(),
    getCategoryCounts(),
  ]);

  // List posts (exclude featured from the main list if showing all categories and featured exists)
  const listPosts =
    !activeCategory && featuredPost
      ? posts.filter((p) => p.id !== featuredPost.id)
      : posts;

  return (
    <>
      {/* ----------------------------------------------------------- 01 Hero */}
      <Section tone="gradient" pad="hero">
        <div className="flex max-w-[700px] flex-col items-start gap-4.5">
          <span className="font-mono text-mono-label uppercase tracking-widest text-blue">
            {"// Blog"}
          </span>
          <h1 className="text-display font-extrabold tracking-tight text-ink lg:text-[48px] lg:leading-[1.14]">
            Writing about software,
            <br />
            business and <span className="text-blue">Somalia</span>
          </h1>
          <p className="text-body-large leading-[1.75] text-ink-body">
            Things worth knowing if you run a business here and you are thinking
            about technology. Written to be read, not skimmed.
          </p>
        </div>
      </Section>

      {/* -------------------------------------------------- 02 Featured Post */}
      {featuredPost && !activeCategory && (
        <Section tone="white" pad="band-sm">
          <Reveal>
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group grid grid-cols-1 overflow-hidden rounded-[16px] border border-border bg-white shadow-card transition-all hover:border-border-strong hover:shadow-card md:grid-cols-2"
            >
              <div className="relative flex h-[260px] items-center justify-center bg-accent-soft sm:h-[340px]">
                <span className="absolute top-4.5 left-4.5 font-mono text-mono-meta font-semibold text-blue">
                  # {String(featuredPost.number).padStart(3, "0")}
                </span>
                {featuredPost.cover ? (
                  <CoverImage image={featuredPost.cover} sizes="(min-width: 1024px) 50vw, 100vw" eager />
                ) : (
                  <PostArt index={0} className="text-placeholder-line" />
                )}
              </div>

              <div className="flex flex-col justify-center gap-3.5 p-7 sm:p-11">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-[5px] bg-blue px-2.25 py-1 font-mono text-mono-chip uppercase text-white">
                    Featured
                  </span>
                  <span className="font-mono text-mono-meta tracking-wide uppercase text-blue">
                    {POST_CATEGORY_LABELS[featuredPost.category]}
                  </span>
                </div>

                <h2 className="text-h2 font-extrabold tracking-tight text-ink leading-[1.22] group-hover:text-blue lg:text-[32px]">
                  {featuredPost.title}
                </h2>

                <p className="text-body-large leading-[1.7] text-ink-body">
                  {featuredPost.excerpt}
                </p>

                <div className="flex items-center gap-2.5 pt-1 font-mono text-mono-meta text-muted">
                  <time dateTime={featuredPost.publishedAt}>
                    {dateFormat.format(new Date(featuredPost.publishedAt))}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>{featuredPost.readingTime} min read</span>
                </div>

                <div className="flex items-center gap-2 pt-2 font-semibold text-blue">
                  <span>Read the article</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  >
                    <path d="M3 11L11 3M5 3h6v6" />
                  </svg>
                </div>
              </div>
            </Link>
          </Reveal>
        </Section>
      )}

      {/* ------------------------------------------- 03 Post List + Right Rail */}
      <Section tone="tint">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_300px]">
          {/* Main List Column */}
          <div className="flex flex-col gap-6">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/blog"
                className={`rounded-full px-4.5 py-2 text-[13px] font-semibold transition-button ${
                  !activeCategory
                    ? "bg-blue text-white"
                    : "border border-border bg-white text-ink-3 hover:border-border-strong hover:bg-tint-soft"
                }`}
              >
                All
              </Link>
              {POST_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/blog?category=${cat}`}
                  className={`rounded-full px-4.5 py-2 text-[13px] font-semibold transition-button ${
                    activeCategory === cat
                      ? "bg-blue text-white"
                      : "border border-border bg-white text-ink-3 hover:border-border-strong hover:bg-tint-soft"
                  }`}
                >
                  {POST_CATEGORY_LABELS[cat]}
                </Link>
              ))}
            </div>

            {/* List of Post Cards */}
            {listPosts.length === 0 ? (
              <div className="rounded-card border border-border bg-white p-12 text-center text-ink-body">
                No articles published in this category yet.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {listPosts.map((post, idx) => (
                  <Reveal key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group grid grid-cols-1 items-center overflow-hidden rounded-card border border-border bg-white shadow-card transition-all hover:border-border-strong sm:grid-cols-[240px_1fr]"
                    >
                      <div className="relative flex h-[172px] items-center justify-center bg-accent-soft">
                        <span className="absolute top-3 left-3 font-mono text-mono-meta font-semibold text-blue">
                          # {String(post.number).padStart(3, "0")}
                        </span>
                        {post.cover ? (
                          <CoverImage image={post.cover} sizes="240px" />
                        ) : (
                          <PostArt index={idx} className="text-placeholder-line" />
                        )}
                      </div>

                      <div className="flex flex-col justify-center gap-2.25 p-6 sm:px-7">
                        <span className="font-mono text-[10px] tracking-[0.1em] text-blue uppercase">
                          {POST_CATEGORY_LABELS[post.category]}
                        </span>
                        <h3 className="text-h3 font-bold tracking-tight text-ink group-hover:text-blue lg:text-[21px]">
                          {post.title}
                        </h3>
                        <p className="line-clamp-2 text-small leading-[1.65] text-ink-body">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-2.25 font-mono text-mono-meta text-muted">
                          <time dateTime={post.publishedAt}>
                            {dateFormat.format(new Date(post.publishedAt))}
                          </time>
                          <span aria-hidden="true">·</span>
                          <span>{post.readingTime} min read</span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          {/* Right Rail */}
          <aside className="flex flex-col gap-4">
            {/* Membership Box */}
            <BlogMembershipBox />

            {/* Categories Counter Box */}
            <div className="flex flex-col gap-3.5 rounded-card border border-border bg-white p-6 shadow-card">
              <span className="font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
                CATEGORIES
              </span>
              <div className="flex flex-col gap-2.75 text-small">
                {POST_CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    href={`/blog?category=${cat}`}
                    className="flex items-center justify-between text-ink-2 hover:text-blue"
                  >
                    <span
                      className={
                        activeCategory === cat
                          ? "font-semibold text-blue"
                          : undefined
                      }
                    >
                      {POST_CATEGORY_LABELS[cat]}
                    </span>
                    <span className="font-mono text-muted">
                      {categoryCounts[cat]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
