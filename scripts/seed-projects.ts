/**
 * The three projects docs/06-BUILD-PROMPTS.md Phase 6 seeds: SomaliNotes AI,
 * Heelan Home Health Care and Fursad.
 *
 * Every sentence is approved copy from design/ — design/01-home.html,
 * design/04-projects.html, design/05-project-detail.html,
 * design/27-admin-projects-list.html and design/28-admin-project-editor.html.
 * Only Heelan has a written case study there. Where the design has no copy,
 * the field holds a bracketed placeholder so the page can be published and
 * seen, and so it is obvious what still needs writing — CLAUDE.md rule 10.
 * Nothing here is invented. DECISIONS.md D-075.
 *
 * The covers are placeholders too (public/placeholders/), until real
 * screenshots are uploaded in the admin.
 *
 * Runs only when there are no projects at all, so it never overwrites work.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { textToDoc } from "../lib/editor-text";
import { Project, StoredFile } from "../models";

type Log = (line: string) => void;

const PLACEHOLDER = {
  problem: "[ The problem this project solves — to be written in the admin. ]",
  body: "[ What was built — to be written in the admin. ]",
  stack: "[ STACK ]",
};

async function placeholderCover(kind: "browser" | "phone" | "dashboard") {
  const filename = `placeholder-project-cover-${kind}.svg`;
  const existing = await StoredFile.findOne({ filename });
  if (existing) return existing._id;

  const file = path.join(
    process.cwd(),
    "public",
    "placeholders",
    `project-cover-${kind}.svg`,
  );
  const created = await StoredFile.create({
    filename,
    originalName: `[ placeholder cover — ${kind} ]`,
    mimeType: "image/svg+xml",
    size: readFileSync(file).length,
    width: 1200,
    height: 630,
    url: `/placeholders/project-cover-${kind}.svg`,
    /* decorative until a real screenshot replaces it */
    alt: "",
  });
  return created._id;
}

export async function seedProjects(log: Log) {
  if ((await Project.countDocuments()) > 0) {
    log("projects   exist — left unchanged");
    return;
  }

  const projects = [
    {
      title: "SomaliNotes AI",
      slug: "somalinotes-ai",
      client: "Final Year Project",
      year: 2026,
      type: "platform" as const,
      status: "live" as const,
      /* design/04-projects.html; the home page's longer line is 124
         characters, over the 120 the summary allows */
      summary:
        "Students record a lecture and get clean study notes in Somali minutes later.",
      coverImage: await placeholderCover("browser"),
      problem: PLACEHOLDER.problem,
      body: textToDoc(PLACEHOLDER.body),
      stack: [PLACEHOLDER.stack],
    },
    {
      title: "Heelan Home Health Care",
      slug: "heelan-home-health-care",
      client: "Heelan Home Health Care",
      year: 2026,
      type: "mobile-app" as const,
      status: "building" as const,
      /* design/28-admin-project-editor.html, the line that fits 120 */
      summary:
        "A patient asks for a nurse at home from their phone, pays with mobile money, and the clinic sees every visit.",
      coverImage: await placeholderCover("phone"),
      headings: {
        problem: "Care was happening, but nobody could see it",
        constraints: "Live nurse tracking, and the whole map",
        body: "One request, five clear stages",
      },
      problem:
        "Heelan sends nurses to patients' homes across Mogadishu. Requests arrived by phone call. Assignments were made in a notebook. Payment happened in cash, or did not happen. Nobody at the office could answer a simple question — how many visits happened yesterday, and were they all paid for.",
      constraints: textToDoc(
        [
          "The original plan had a map showing each nurse moving toward the patient in real time. It was the most impressive thing in the proposal and it would have been the first thing to break. Outside the centre of the city a phone loses signal for twenty minutes at a stretch — long enough for the map to show a nurse frozen in a field while a patient waits and loses confidence in the whole system.",
          "> We replaced it with one message: **your nurse is on the way, expected within the hour**. It is honest, it cannot break, and in testing nobody asked for the map.",
        ].join("\n\n"),
      ),
      body: textToDoc(
        [
          "A patient app for requesting a visit, ordering medicine and paying. A staff portal where the office confirms a request, assigns a nurse, and marks the visit complete. Both sit on one database, so the office and the patient are always looking at the same fact.",
          [
            "1. **Request** — The patient asks for a visit and describes the need",
            "2. **Confirmation** — The office accepts it and a time window is set",
            "3. **Assignment** — A nurse is assigned and notified",
            "4. **Service** — The visit happens and is recorded",
            "5. **Completed** — Payment confirmed, receipt sent, the record closed",
          ].join("\n"),
        ].join("\n\n"),
      ),
      decisions: [
        {
          decision:
            "Verification codes go through the local network, not a foreign service",
          reason:
            "Codes sent through the provider Somali phones actually use arrive in seconds. Sent the usual international way, many never arrive at all — and a patient who cannot sign up is a patient lost at the door.",
        },
        {
          decision: "Payment is confirmed by the server, never by the phone",
          reason:
            "The app never decides that money has arrived. It asks the server, the server checks with the wallet, and only then is a visit marked as paid.",
        },
        {
          decision: "One system, not many small ones",
          reason:
            "A team of three maintains this. Splitting it into separate services would have looked modern and doubled the work of keeping it alive.",
        },
      ],
      stack: ["Flutter", "React", "FastAPI", "PostgreSQL", "Redis"],
      role: "Design and full build",
      team: ["Three developers, including me"],
      timeline: "Sept 2026 — ongoing",
    },
    {
      title: "Fursad",
      slug: "fursad",
      client: "Own product",
      year: 2026,
      type: "platform" as const,
      status: "building" as const,
      /* design/01-home.html */
      summary:
        "People looking for work and companies looking for people find each other, instead of both waiting on a WhatsApp group.",
      coverImage: await placeholderCover("dashboard"),
      problem: PLACEHOLDER.problem,
      body: textToDoc(PLACEHOLDER.body),
      stack: [PLACEHOLDER.stack],
    },
  ];

  /* Saved one by one, in order, so each goes through the model's rules — and
     given explicit positions, so the list reads 001, 002, 003 as designed. */
  for (const [position, data] of projects.entries()) {
    const project = new Project({
      ...data,
      position,
      state: "published",
      featured: true,
    });
    await project.save();
  }

  log(
    `projects   created — ${projects.map((p) => p.title).join(", ")} (published, featured; placeholders marked [ ])`,
  );
}
