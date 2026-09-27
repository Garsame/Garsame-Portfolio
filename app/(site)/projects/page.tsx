import type { Metadata } from "next";
import { Button } from "@/components/ui";
import { Section } from "@/components/site/Section";
import { ProjectIndex } from "@/components/site/projects/ProjectIndex";
import { getPublishedProjects } from "@/lib/projects";

/**
 * /projects — docs/03-PAGES.md, drawn from design/04-projects.html.
 *
 * Static HTML from the database. The admin revalidates this page whenever a
 * project changes (app/admin/(editor)/projects/actions.ts); the hour below is
 * only a safety net for changes made outside the admin, such as the seed.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Everything Garsame Mohamud has built — what the problem was, what was removed, what was built and what changed afterwards.",
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <>
      <Section
        tone="gradient"
        pad="none"
        className="pt-section-sm pb-6 lg:pt-17 lg:pb-11"
      >
        <div className="flex max-w-intro flex-col gap-4.5">
          <span className="font-mono text-mono-label text-blue uppercase">
            <span aria-hidden="true">{"// "}</span>
            Projects
          </span>
          <h1 className="text-display-sm text-ink lg:text-page-title">
            Everything I have <span className="text-blue">built</span>
          </h1>
          <p className="text-body-lg leading-loose text-ink-body">
            Each one is written up the same way: what the problem was, what I
            removed, what I built, and what changed afterwards.
          </p>
        </div>
      </Section>

      <Section tone="white" pad="none" className="pb-section-sm lg:pb-22">
        <ProjectIndex projects={projects} />
      </Section>

      <Section tone="ink" pad="none" className="py-section-sm lg:py-15">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="flex flex-col gap-2.5">
            <h2 className="text-h1-sm text-white">
              Yours could be the next one
            </h2>
            <p className="text-body text-on-ink-body">
              Tell me the problem. I will tell you honestly whether I am the
              right person for it.
            </p>
          </div>
          <div className="shrink-0">
            <Button href="/contact">Start a Project</Button>
          </div>
        </div>
      </Section>
    </>
  );
}
