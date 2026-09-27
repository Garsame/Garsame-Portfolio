import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostContent } from "@/components/site/blog/BlogPostContent";
import { ArticleJsonLd } from "@/components/site/JsonLd";
import {
  getAllPublishedPostSlugs,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getAllPublishedPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const ogImageUrl =
    post.cover?.url ||
    `/api/og?title=${encodeURIComponent(title)}&type=post&category=${encodeURIComponent(post.category || "")}&description=${encodeURIComponent(description || "")}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      authors: ["Garsame Mohamud"],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post.category, post.slug);

  return (
    <>
      <ArticleJsonLd post={post} />
      <BlogPostContent post={post} relatedPosts={relatedPosts} />
    </>
  );
}
