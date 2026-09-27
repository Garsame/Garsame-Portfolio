import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/site/projects/ProjectPage";
import { ProjectJsonLd } from "@/components/site/JsonLd";
import { getProjectPage, getPublishedSlugs } from "@/lib/projects";

/**
 * One project case study — docs/03-PAGES.md, design/05-project-detail.html.
 *
 * Every published project is rendered to static HTML at build time; one
 * published later is rendered on its first visit and kept. The admin
 * revalidates the page on every change, so an unpublished project stops
 * being served at once. An unknown or unpublished slug is a 404.
 */

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getProjectPage(slug);
  if (!page) return {};

  const { project } = page;
  const title = project.seoTitle || project.title;
  const description = project.seoDescription || project.summary;
  const ogImageUrl =
    project.cover?.url ||
    `/api/og?title=${encodeURIComponent(title)}&type=project&category=${encodeURIComponent(project.type || "")}&description=${encodeURIComponent(description || "")}`;

  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: project.cover?.alt || title,
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

export default async function ProjectRoute({ params }: Props) {
  const { slug } = await params;
  const page = await getProjectPage(slug);
  if (!page) notFound();

  return (
    <>
      <ProjectJsonLd project={page.project} />
      <ProjectPage project={page.project} context={page.context} />
    </>
  );
}
