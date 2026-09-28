/**
 * The three projects docs/06-BUILD-PROMPTS.md Phase 6 seeds: SomaliNotes AI,
 * Heelan Home Health Care and Fursad.
 *
 * Every sentence is approved copy — Heelan's from design/ (design/01-home.html,
 * design/04-projects.html, design/05-project-detail.html,
 * design/27-admin-projects-list.html, design/28-admin-project-editor.html);
 * SomaliNotes AI's and Fursad's from Garsame's CV, added in the CV/content
 * pass (DECISIONS.md D-138). Fursad's stack still holds a bracketed
 * placeholder — the CV does not itemise it — so the page can be published and
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
      /* Case study written from Garsame's CV, September 2026 — DECISIONS.md
         D-138. The CV tags this "RESEARCH", not "LIVE": a final-year project,
         evaluated and presented at HUMC 2026, with no live URL given
         (unlike MadrasaHub, JobAssistAI, MGB and NTW, which all have one).
         Status changed from "live" to "completed" to match — worth Garsame's
         own check, since "live" may have been intentional if it is still
         reachable somewhere. */
      title: "SomaliNotes AI",
      slug: "somalinotes-ai",
      client: "Final Year Project",
      year: 2026,
      type: "platform" as const,
      status: "completed" as const,
      /* design/04-projects.html; the home page's longer line is 124
         characters, over the 120 the summary allows */
      summary:
        "Students record a lecture and get clean study notes in Somali minutes later.",
      coverImage: await placeholderCover("browser"),
      headings: {
        problem: "Somali has almost no place in modern AI tools",
        body: "A four-stage pipeline, evaluated with real students",
      },
      problem:
        "Somali-speaking students recording a lecture had no way to turn it into something they could actually study from. Most transcription and note-taking tools barely support Somali at all, and the ones that try are built and tuned for English, so the output is unreliable for anything beyond the simplest audio.",
      body: textToDoc(
        [
          "Built as my final-year project — Baro Platform — a pipeline that downloads and extracts the audio from a recorded lecture, transcribes it, generates structured study notes in Somali, and produces a spoken audio version of those notes. Long jobs run in the background rather than tying up the request, so a full lecture can be processed without the page timing out or the student waiting on a spinner.",
          [
            "1. **Upload** — the student uploads or links a recorded lecture",
            "2. **Transcribe** — the audio is transcribed and cleaned up",
            "3. **Generate** — structured Somali notes are written from the transcript",
            "4. **Listen or read** — the notes are available as text and as spoken audio",
          ].join("\n"),
          "> Evaluated with real participants across seven dimensions: usability 4.57/5, educational value 5.00/5, overall 4.29/5. A condensed version was presented at the Hormuud University Multidisciplinary Conference (HUMC) 2026.",
        ].join("\n\n"),
      ),
      stack: [
        "Next.js",
        "FastAPI",
        "Celery",
        "OpenAI Whisper",
        "Google Gemini",
        "Azure Cognitive Services",
        "PostgreSQL",
      ],
      role: "Research, design and full build",
      team: ["Solo — final-year project"],
      timeline: "2026",
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
      /* Case study written from Garsame's CV, September 2026 — DECISIONS.md
         D-138. The CV lists this project live at jobassistai.garsame.com, so
         status moved from "building" to "live" and liveUrl is set. The exact
         tech stack is not itemised per-project in the CV the way Baro
         Platform's is, so it stays a bracketed placeholder rather than a
         guess — the one open field from this pass. */
      title: "Fursad",
      slug: "fursad",
      client: "Own product",
      year: 2026,
      type: "platform" as const,
      status: "live" as const,
      liveUrl: "https://jobassistai.garsame.com",
      /* design/01-home.html */
      summary:
        "People looking for work and companies looking for people find each other, instead of both waiting on a WhatsApp group.",
      coverImage: await placeholderCover("dashboard"),
      headings: {
        problem: "Good candidates and open roles were missing each other",
        body: "One profile, scored against every open role",
      },
      problem:
        "Job seekers and employers in the Somali market had no dedicated place to find each other. Matching happened informally — personal networks, classifieds, WhatsApp groups — so a good candidate could sit unseen while a role stayed open, and an employer had no way to reach past whoever was already in their contacts.",
      body: textToDoc(
        [
          "Live today as JobAssistAI. A candidate builds a profile once, and a matching engine scores it against open positions, so they see the roles that actually fit instead of searching blindly through listings built for a different market. The goal throughout was reducing the time between a vacancy appearing and the right person applying for it.",
          [
            "1. **Profile** — a candidate builds their profile once",
            "2. **Match** — the engine scores them against open vacancies",
            "3. **Apply** — they apply to the roles that actually fit, in one flow",
          ].join("\n"),
        ].join("\n\n"),
      ),
      stack: [PLACEHOLDER.stack],
      role: "Design and full build",
      team: ["Solo — own product"],
      timeline: "2026",
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
