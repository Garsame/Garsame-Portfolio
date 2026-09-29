import "server-only";

import { dbConnect } from "@/lib/db";
import { Settings } from "@/models";
import {
  bio as defaultBio,
  clients as defaultClients,
  contact as defaultContact,
  faq as defaultFaq,
  hero as defaultHero,
  process as defaultProcess,
  services as defaultServices,
  site as defaultSite,
  socialLinks as defaultSocialLinks,
  type Availability,
  type HeroBadge,
} from "@/lib/content/home";

export type PopulatedFile = {
  id: string;
  url: string;
  originalName: string;
  width?: number;
  height?: number;
};

export type PublicSiteSettings = {
  // Identity & Branding
  logo: PopulatedFile | null;
  availability: Availability;
  availabilityText: string;
  location: string;

  // Hero
  heroHeadingLine1: string;
  heroHeadingLine2Prefix: string;
  heroRotatingWords: string[];
  heroParagraph: string;
  heroPortrait: PopulatedFile | null;
  breakImage: PopulatedFile | null;
  heroBadges: HeroBadge[];

  // Bio & Contact
  bioShort: string;
  bioLong: string;
  phone: string;
  email: string;
  socialLinks: { platform: string; url: string }[];
  cvFile: PopulatedFile | null;

  // Sections
  clients: { name: string; avatar: PopulatedFile | null }[];
  faq: { question: string; answer?: string; order: number }[];
  services: {
    title: string;
    description: string;
    icon: "screen" | "phone" | "chart" | "mail" | "automation" | "support";
    order: number;
  }[];
  processSteps: { title: string; description: string; order: number }[];

  // SEO & Meta
  metaDescription: string;
  socialImage: PopulatedFile | null;
};

function mapToneToIcon(
  tone: "warning" | "success" | "accent",
): "bolt" | "check" | "clock" {
  switch (tone) {
    case "warning":
      return "bolt";
    case "success":
      return "check";
    case "accent":
    default:
      return "clock";
  }
}

/**
 * `clients` was `string[]` before D-139. A Settings document seeded or
 * saved before that change still has raw strings stored where the schema
 * now expects `{ name, avatar }`, and Mongoose's `.lean()` returns exactly
 * what's stored — no casting. Normalizing on read means the site never
 * shows a broken client name for data saved under the old shape.
 */
function normalizeClient(
  c:
    | string
    | {
        name: string;
        avatar?: { _id: unknown; url: string; originalName: string };
      },
): {
  name: string;
  avatar?: { _id: unknown; url: string; originalName: string };
} {
  return typeof c === "string" ? { name: c } : c;
}

export async function getSiteSettings(): Promise<PublicSiteSettings> {
  try {
    await dbConnect();
    const doc = await Settings.findOne({ key: "site" })
      .populate<{
        logo?: {
          _id: unknown;
          url: string;
          originalName: string;
          width?: number;
          height?: number;
        };
      }>("logo", "url originalName width height")
      .populate<{
        heroPortrait?: {
          _id: unknown;
          url: string;
          originalName: string;
          width?: number;
          height?: number;
        };
      }>("heroPortrait", "url originalName width height")
      .populate<{
        breakImage?: {
          _id: unknown;
          url: string;
          originalName: string;
          width?: number;
          height?: number;
        };
      }>("breakImage", "url originalName width height")
      .populate<{
        cvFile?: { _id: unknown; url: string; originalName: string };
      }>("cvFile", "url originalName")
      .populate<{
        socialImage?: {
          _id: unknown;
          url: string;
          originalName: string;
          width?: number;
          height?: number;
        };
      }>("socialImage", "url originalName width height")
      .populate<{
        clients: (
          | string
          | {
              name: string;
              avatar?: { _id: unknown; url: string; originalName: string };
            }
        )[];
      }>("clients.avatar", "url originalName")
      .lean();

    if (!doc) {
      return getFallbackSettings();
    }

    const badges: HeroBadge[] =
      doc.heroBadges && doc.heroBadges.length === 3
        ? doc.heroBadges.map((b) => ({
            label: b.label,
            value: b.value,
            tone: b.tone as "warning" | "success" | "accent",
            icon: mapToneToIcon(b.tone as "warning" | "success" | "accent"),
          }))
        : defaultHero.badges;

    const servicesList =
      doc.services && doc.services.length > 0
        ? doc.services.map((s, i) => ({
            title: s.title,
            description: s.description,
            icon: s.icon as PublicSiteSettings["services"][number]["icon"],
            order: s.order ?? i + 1,
          }))
        : defaultServices.map((s, i) => ({
            title: s.title,
            description: s.description,
            icon: "screen" as const,
            order: i + 1,
          }));

    const stepsList =
      doc.processSteps && doc.processSteps.length > 0
        ? doc.processSteps.map((p, i) => ({
            title: p.title,
            description: p.description,
            order: p.order ?? i + 1,
          }))
        : defaultProcess.steps.map((p, i) => ({
            title: p.title,
            description: p.description,
            order: i + 1,
          }));

    const faqList =
      doc.faq && doc.faq.length > 0
        ? doc.faq.map((f, i) => ({
            question: f.question,
            answer: f.answer || undefined,
            order: f.order ?? i + 1,
          }))
        : defaultFaq.items.map((f, i) => ({
            question: f.question,
            answer: f.answer || undefined,
            order: i + 1,
          }));

    return {
      logo: doc.logo
        ? {
            id: String(doc.logo._id),
            url: doc.logo.url,
            originalName: doc.logo.originalName,
            width: doc.logo.width,
            height: doc.logo.height,
          }
        : null,
      availability:
        (doc.availability as Availability) || defaultHero.availability,
      availabilityText: doc.availabilityText || defaultHero.availabilityText,
      location: doc.location || defaultHero.location,

      heroHeadingLine1: doc.heroHeadingLine1 || defaultHero.headingLine1,
      heroHeadingLine2Prefix:
        doc.heroHeadingLine2Prefix || defaultHero.headingLine2Prefix,
      heroRotatingWords:
        doc.heroRotatingWords && doc.heroRotatingWords.length > 0
          ? doc.heroRotatingWords
          : defaultHero.rotatingWords,
      heroParagraph: doc.heroParagraph || defaultHero.paragraph,

      heroPortrait: doc.heroPortrait
        ? {
            id: String(doc.heroPortrait._id),
            url: doc.heroPortrait.url,
            originalName: doc.heroPortrait.originalName,
            width: doc.heroPortrait.width,
            height: doc.heroPortrait.height,
          }
        : null,

      breakImage: doc.breakImage
        ? {
            id: String(doc.breakImage._id),
            url: doc.breakImage.url,
            originalName: doc.breakImage.originalName,
            width: doc.breakImage.width,
            height: doc.breakImage.height,
          }
        : null,

      heroBadges: badges,

      bioShort: doc.bioShort || defaultBio.short,
      bioLong: doc.bioLong || defaultBio.long,
      phone: doc.phone || defaultContact.phone || "",
      email: doc.email || defaultContact.email || "",
      socialLinks:
        doc.socialLinks && doc.socialLinks.length > 0
          ? doc.socialLinks.map((s) => ({ platform: s.platform, url: s.url }))
          : defaultSocialLinks,
      cvFile: doc.cvFile
        ? {
            id: String(doc.cvFile._id),
            url: doc.cvFile.url,
            originalName: doc.cvFile.originalName,
          }
        : null,

      clients:
        doc.clients && doc.clients.length > 0
          ? doc.clients.map(normalizeClient).map((c) => ({
              name: c.name,
              avatar: c.avatar
                ? {
                    id: String(c.avatar._id),
                    url: c.avatar.url,
                    originalName: c.avatar.originalName,
                  }
                : null,
            }))
          : defaultClients.map((c) => ({ ...c, avatar: null })),
      faq: faqList,
      services: servicesList,
      processSteps: stepsList,

      metaDescription: doc.metaDescription || defaultSite.metaDescription,
      socialImage: doc.socialImage
        ? {
            id: String(doc.socialImage._id),
            url: doc.socialImage.url,
            originalName: doc.socialImage.originalName,
          }
        : null,
    };
  } catch (err) {
    console.error("[settings:getSiteSettings]", err);
    return getFallbackSettings();
  }
}

function getFallbackSettings(): PublicSiteSettings {
  return {
    logo: null,
    availability: defaultHero.availability,
    availabilityText: defaultHero.availabilityText,
    location: defaultHero.location,

    heroHeadingLine1: defaultHero.headingLine1,
    heroHeadingLine2Prefix: defaultHero.headingLine2Prefix,
    heroRotatingWords: defaultHero.rotatingWords,
    heroParagraph: defaultHero.paragraph,
    heroPortrait: null,
    breakImage: null,
    heroBadges: defaultHero.badges,

    bioShort: defaultBio.short,
    bioLong: defaultBio.long,
    phone: defaultContact.phone || "",
    email: defaultContact.email || "",
    socialLinks: defaultSocialLinks,
    cvFile: null,

    clients: defaultClients.map((c) => ({ ...c, avatar: null })),
    faq: defaultFaq.items.map((f, i) => ({
      question: f.question,
      answer: f.answer || undefined,
      order: i + 1,
    })),
    services: defaultServices.map((s, i) => ({
      title: s.title,
      description: s.description,
      icon: "screen" as const,
      order: i + 1,
    })),
    processSteps: defaultProcess.steps.map((p, i) => ({
      title: p.title,
      description: p.description,
      order: i + 1,
    })),

    metaDescription: defaultSite.metaDescription,
    socialImage: null,
  };
}
