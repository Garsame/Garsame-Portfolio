import { isEmptyDoc } from "./editor-content";

/**
 * The project rules that both sides need — docs/04-ADMIN.md §5.
 *
 * The model enforces them on save; the editor shows the same rules as they are
 * typed, so the "Required" badge and the error a publish returns can never
 * disagree. No database access, so it is safe to import in the browser.
 */

export const PROJECT_TYPES = [
  "web-app",
  "mobile-app",
  "platform",
  "website",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_STATUSES = [
  "live",
  "building",
  "completed",
  "concept",
] as const;
export type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];

/** The filter chips on /projects — docs/03-PAGES.md. */
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  "web-app": "Web app",
  "mobile-app": "Mobile app",
  platform: "Platform",
  website: "Website",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatusValue, string> = {
  live: "Live",
  building: "Building",
  completed: "Completed",
  concept: "Concept",
};

/** "Featured switch, limited to three". */
export const MAX_FEATURED_PROJECTS = 3;
export const PROJECT_SUMMARY_MAX = 120;
export const PROJECT_TITLE_MAX = 140;
export const PROJECT_SEO_TITLE_MAX = 70;
export const PROJECT_SEO_DESCRIPTION_MAX = 160;

export type PublishFields = {
  client?: string | null;
  year?: number | null;
  type?: string | null;
  status?: string | null;
  summary?: string | null;
  coverImage?: unknown;
  problem?: string | null;
  body?: unknown;
  stack?: readonly string[] | null;
};

/**
 * Everything missing before a project can be published, one sentence per
 * field, keyed by the field name. Empty when it is ready.
 */
export function projectPublishProblems(
  p: PublishFields,
): Record<string, string> {
  const problems: Record<string, string> = {};
  if (!p.client?.trim()) problems.client = "Add the client or context.";
  if (!p.year) problems.year = "Add the year.";
  if (!p.type) problems.type = "Choose the project type.";
  if (!p.status) problems.status = "Choose the project status.";
  if (!p.summary?.trim()) problems.summary = "Write the one-line summary.";
  if (!p.coverImage) problems.coverImage = "Add a cover image.";
  if (!p.problem?.trim()) problems.problem = "Describe the problem.";
  if (isEmptyDoc(p.body)) problems.body = "Write what you built.";
  if (!p.stack?.length) problems.stack = "Add at least one stack tag.";
  return problems;
}
