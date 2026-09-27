import type { EditorNode } from "@/lib/editor-content";
import type { PostCategory } from "@/lib/blog-rules";

export type PostTemplateKey =
  | "case-note"
  | "explainer"
  | "opinion"
  | "blank";

export type PostTemplate = {
  key: PostTemplateKey;
  title: string;
  description: string;
  defaultCategory: PostCategory;
  doc: EditorNode;
};

export const POST_TEMPLATES: PostTemplate[] = [
  {
    key: "case-note",
    title: "Case note",
    description: "Write up a specific system build, the problem, and what worked in practice.",
    defaultCategory: "technology",
    doc: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Introduce the context: who the client or system was for, and what problem was costing them time or money.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "The problem before we touched anything" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Explain what was breaking or slow in daily operations.",
            },
          ],
        },
        {
          type: "callout",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Key takeaway or operational constraint that shaped the solution.",
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "What we built and what we cut" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Describe the actual system that was delivered and why non-essential features were omitted.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "The outcome" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "What changed for the staff and the business after going live.",
            },
          ],
        },
      ],
    },
  },
  {
    key: "explainer",
    title: "Technical explainer",
    description: "Break down a technical concept or tool in plain English for business readers.",
    defaultCategory: "technology",
    doc: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Open with the everyday question or misconception that businesses encounter.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "How it actually works" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Walk through the process step by step in clear language.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Where it breaks down" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Explain edge cases, local constraints (network, offline usage, mobile payments), and pitfalls.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "What you should do" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Actionable advice for business owners deciding on their next step.",
            },
          ],
        },
      ],
    },
  },
  {
    key: "opinion",
    title: "Short opinion",
    description: "A focused perspective on building software and technology in East Africa.",
    defaultCategory: "business",
    doc: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "State the core thesis directly in the opening paragraph.",
            },
          ],
        },
        {
          type: "callout",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "The main counter-intuitive argument or principle.",
                },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Support the argument with real observations from field work and client systems.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Conclude with a clear rule or recommendation.",
            },
          ],
        },
      ],
    },
  },
  {
    key: "blank",
    title: "Blank",
    description: "Start with an empty page.",
    defaultCategory: "technology",
    doc: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "" }],
        },
      ],
    },
  },
];

export function getTemplate(key: string | null | undefined): PostTemplate {
  const found = POST_TEMPLATES.find((t) => t.key === key);
  return found ?? POST_TEMPLATES[0];
}
