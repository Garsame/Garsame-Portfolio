import type { MetadataRoute } from "next";
import { dbConnect } from "@/lib/db";
import { Post, Project } from "@/models";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://garsame.so";
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/services`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/testimonials`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/membership`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    await dbConnect();

    const [publishedProjects, publishedPosts] = await Promise.all([
      Project.find({ state: "published" })
        .select("slug updatedAt")
        .lean<{ slug: string; updatedAt?: Date }[]>(),
      Post.find({ state: "published" })
        .select("slug updatedAt")
        .lean<{ slug: string; updatedAt?: Date }[]>(),
    ]);

    const projectRoutes: MetadataRoute.Sitemap = publishedProjects.map((p) => ({
      url: `${siteUrl}/projects/${p.slug}`,
      lastModified: p.updatedAt || now,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

    const postRoutes: MetadataRoute.Sitemap = publishedPosts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || now,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...projectRoutes, ...postRoutes];
  } catch (err) {
    console.error("[sitemap] Failed to load dynamic database routes:", err);
    return staticRoutes;
  }
}
