"use client";

import { useState } from "react";
import { FilterPill } from "@/components/ui";
import { ProjectCard } from "@/components/site/ProjectCard";
import {
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  type ProjectType,
} from "@/lib/project-rules";
import type { ProjectCardView } from "@/lib/project-view";

/**
 * The /projects grid with its type filter — docs/03-PAGES.md: "Filter chips by
 * type: All · Web app · Mobile app · Platform · Website."
 *
 * Every published project is in the server HTML, so a search engine and a
 * visitor without JavaScript see all of them; the chips only hide cards. Each
 * card keeps its "/ 00n" tag from the full list, so a project's number does
 * not change with the filter.
 */
export function ProjectIndex({ projects }: { projects: ProjectCardView[] }) {
  const [type, setType] = useState<ProjectType | "all">("all");

  const count = (t: ProjectType) => projects.filter((p) => p.type === t).length;
  const shown = projects
    .map((project, index) => ({ project, index }))
    .filter(({ project }) => type === "all" || project.type === type);

  const chips: { value: ProjectType | "all"; label: string; n: number }[] = [
    { value: "all", label: "All", n: projects.length },
    ...PROJECT_TYPES.map((t) => ({
      value: t,
      label: PROJECT_TYPE_LABELS[t],
      n: count(t),
    })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div
          role="group"
          aria-label="Filter projects by type"
          className="flex flex-wrap gap-2.25"
        >
          {chips.map((chip) => (
            <FilterPill
              key={chip.value}
              active={type === chip.value}
              onClick={() => setType(chip.value)}
              ariaPressed={type === chip.value}
            >
              {chip.label} · {chip.n}
            </FilterPill>
          ))}
        </div>
        <span
          aria-live="polite"
          className="font-mono text-mono-label font-regular tracking-none text-muted"
        >
          Showing {shown.length} {shown.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {shown.length > 0 ? (
        <ul className="grid gap-5 pt-5 md:grid-cols-2 lg:grid-cols-3">
          {shown.map(({ project, index }) => (
            <li key={project.slug} className="h-full">
              <ProjectCard
                project={project}
                index={index}
                showType
                showFeatured
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="pt-5 text-body text-ink-body">
          {projects.length === 0
            ? "No projects are published yet."
            : "No projects of this type yet."}
        </p>
      )}
    </div>
  );
}
