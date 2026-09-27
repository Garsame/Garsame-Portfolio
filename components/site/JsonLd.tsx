export type PersonJsonLdProps = {
  url?: string;
  name?: string;
  jobTitle?: string;
  description?: string;
  location?: string;
  socialLinks?: { platform?: string; label?: string; url: string }[];
};

export function PersonJsonLd({
  url = "https://garsame.so",
  name = "Garsame Mohamud",
  jobTitle = "Senior Software Engineer",
  description = "Senior Software Engineer in Mogadishu building fast, resilient web systems and solving complex problems with simple software.",
  location = "Mogadishu, Somalia",
  socialLinks = [],
}: PersonJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle,
    url,
    description,
    address: {
      "@type": "PostalAddress",
      addressLocality: location.split(",")[0]?.trim() || "Mogadishu",
      addressCountry: location.includes("Somalia") ? "Somalia" : undefined,
    },
    sameAs: socialLinks.map((s) => s.url).filter(Boolean),
    knowsAbout: [
      "Software Engineering",
      "Next.js",
      "React",
      "Node.js",
      "TypeScript",
      "MongoDB",
      "System Architecture",
      "Web Performance",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export type ArticleJsonLdProps = {
  post: {
    title: string;
    slug: string;
    seoTitle?: string;
    seoDescription?: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
    publishedAt?: string | Date;
    updatedAt?: string | Date;
    cover?: { url: string } | null;
  };
  siteUrl?: string;
};

export function ArticleJsonLd({
  post,
  siteUrl = "https://garsame.so",
}: ArticleJsonLdProps) {
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const imageUrl =
    post.cover?.url ||
    `${siteUrl}/api/og?title=${encodeURIComponent(post.title)}&type=post&category=${encodeURIComponent(post.category || "")}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    image: [imageUrl],
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
    dateModified: post.updatedAt
      ? new Date(post.updatedAt).toISOString()
      : undefined,
    author: {
      "@type": "Person",
      name: "Garsame Mohamud",
      url: siteUrl,
    },
    publisher: {
      "@type": "Person",
      name: "Garsame Mohamud",
      url: siteUrl,
    },
    articleSection: post.category,
    keywords: post.tags?.join(", "),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export type ProjectJsonLdProps = {
  project: {
    title: string;
    slug: string;
    seoTitle?: string;
    seoDescription?: string;
    summary?: string;
    problem?: string;
    type?: string | null;
    stack?: string[];
    stackTags?: string[];
    year?: number | null;
    cover?: { url: string } | null;
  };
  siteUrl?: string;
};

export function ProjectJsonLd({
  project,
  siteUrl = "https://garsame.so",
}: ProjectJsonLdProps) {
  const projectUrl = `${siteUrl}/projects/${project.slug}`;
  const imageUrl =
    project.cover?.url ||
    `${siteUrl}/api/og?title=${encodeURIComponent(project.title)}&type=project&category=${encodeURIComponent(project.type || "")}`;

  const tags = project.stack || project.stackTags || [];

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    headline: project.summary,
    description: project.problem || project.summary,
    url: projectUrl,
    image: [imageUrl],
    creator: {
      "@type": "Person",
      name: "Garsame Mohamud",
      url: siteUrl,
    },
    dateCreated: project.year ? `${project.year}-01-01` : undefined,
    keywords: tags.join(", "),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
