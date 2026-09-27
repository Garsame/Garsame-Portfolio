import "server-only";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Settings, StoredFile } from "@/models";
import { hero, site } from "@/lib/content/home";

export type BrandingView = {
  logo: { id: string; url: string; originalName: string } | null;
  availability: "available" | "limited" | "booked";
  availabilityText: string;

  heroHeadingLine1: string;
  heroHeadingLine2Prefix: string;
  heroRotatingWords: string[];
  heroParagraph: string;
  heroPortrait: { id: string; url: string; originalName: string } | null;
  breakImage: { id: string; url: string; originalName: string } | null;

  heroBadges: {
    label: string;
    value: string;
    tone: "warning" | "success" | "accent";
  }[];

  socialLinks: { platform: string; url: string }[];
  cvFile: { id: string; url: string; originalName: string } | null;

  metaDescription: string;
  socialImage: { id: string; url: string; originalName: string } | null;
};

export type SaveBrandingPayload = {
  logoId: string | null;
  availability: "available" | "limited" | "booked";
  availabilityText: string;

  heroHeadingLine1: string;
  heroHeadingLine2Prefix: string;
  heroRotatingWords: string[];
  heroParagraph: string;
  heroPortraitId: string | null;
  breakImageId: string | null;

  heroBadges: {
    label: string;
    value: string;
    tone: "warning" | "success" | "accent";
  }[];

  socialLinks: { platform: string; url: string }[];
  cvFileId: string | null;

  metaDescription: string;
  socialImageId: string | null;
};

export async function getBrandingData(): Promise<BrandingView> {
  await dbConnect();
  const doc = await Settings.findOne({ key: "site" })
    .populate<{ logo?: { _id: unknown; url: string; originalName: string } }>("logo", "url originalName")
    .populate<{ heroPortrait?: { _id: unknown; url: string; originalName: string } }>("heroPortrait", "url originalName")
    .populate<{ breakImage?: { _id: unknown; url: string; originalName: string } }>("breakImage", "url originalName")
    .populate<{ cvFile?: { _id: unknown; url: string; originalName: string } }>("cvFile", "url originalName")
    .populate<{ socialImage?: { _id: unknown; url: string; originalName: string } }>("socialImage", "url originalName")
    .lean();

  const badges =
    doc?.heroBadges && doc.heroBadges.length === 3
      ? doc.heroBadges.map((b) => ({
          label: b.label,
          value: b.value,
          tone: b.tone,
        }))
      : hero.badges.map((b) => ({
          label: b.label,
          value: b.value,
          tone: b.tone,
        }));

  return {
    logo: doc?.logo
      ? {
          id: String(doc.logo._id),
          url: doc.logo.url,
          originalName: doc.logo.originalName,
        }
      : null,
    availability: doc?.availability || hero.availability,
    availabilityText: doc?.availabilityText || hero.availabilityText,

    heroHeadingLine1: doc?.heroHeadingLine1 || hero.headingLine1,
    heroHeadingLine2Prefix: doc?.heroHeadingLine2Prefix || hero.headingLine2Prefix,
    heroRotatingWords:
      doc?.heroRotatingWords && doc.heroRotatingWords.length > 0
        ? doc.heroRotatingWords
        : hero.rotatingWords,
    heroParagraph: doc?.heroParagraph || hero.paragraph,

    heroPortrait: doc?.heroPortrait
      ? {
          id: String(doc.heroPortrait._id),
          url: doc.heroPortrait.url,
          originalName: doc.heroPortrait.originalName,
        }
      : null,
    breakImage: doc?.breakImage
      ? {
          id: String(doc.breakImage._id),
          url: doc.breakImage.url,
          originalName: doc.breakImage.originalName,
        }
      : null,

    heroBadges: badges,

    socialLinks:
      doc?.socialLinks && doc.socialLinks.length > 0
        ? doc.socialLinks.map((s) => ({ platform: s.platform, url: s.url }))
        : [
            { platform: "LinkedIn", url: "https://linkedin.com/in/" },
            { platform: "GitHub", url: "https://github.com/Garsame" },
          ],

    cvFile: doc?.cvFile
      ? {
          id: String(doc.cvFile._id),
          url: doc.cvFile.url,
          originalName: doc.cvFile.originalName,
        }
      : null,

    metaDescription: doc?.metaDescription || site.metaDescription,
    socialImage: doc?.socialImage
      ? {
          id: String(doc.socialImage._id),
          url: doc.socialImage.url,
          originalName: doc.socialImage.originalName,
        }
      : null,
  };
}

export async function saveBrandingData(
  payload: SaveBrandingPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    let doc = await Settings.findOne({ key: "site" });
    if (!doc) {
      doc = new Settings({ key: "site" });
    }

    /* Record old file IDs to update StoredFile.usedBy */
    const oldFileIds = new Set<string>();
    if (doc.logo) oldFileIds.add(String(doc.logo));
    if (doc.heroPortrait) oldFileIds.add(String(doc.heroPortrait));
    if (doc.breakImage) oldFileIds.add(String(doc.breakImage));
    if (doc.cvFile) oldFileIds.add(String(doc.cvFile));
    if (doc.socialImage) oldFileIds.add(String(doc.socialImage));

    doc.logo = payload.logoId ? new Types.ObjectId(payload.logoId) : undefined;
    doc.availability = payload.availability;
    doc.availabilityText = payload.availabilityText.trim().slice(0, 60);

    doc.heroHeadingLine1 = payload.heroHeadingLine1.trim().slice(0, 60);
    doc.heroHeadingLine2Prefix = payload.heroHeadingLine2Prefix.trim().slice(0, 60);
    doc.heroRotatingWords = payload.heroRotatingWords
      .map((w) => w.trim().slice(0, 30))
      .filter(Boolean);
    doc.heroParagraph = payload.heroParagraph.trim().slice(0, 400);

    doc.heroPortrait = payload.heroPortraitId
      ? new Types.ObjectId(payload.heroPortraitId)
      : undefined;
    doc.breakImage = payload.breakImageId
      ? new Types.ObjectId(payload.breakImageId)
      : undefined;

    doc.heroBadges = payload.heroBadges.slice(0, 3).map((b) => ({
      label: b.label.trim().slice(0, 30),
      value: b.value.trim().slice(0, 40),
      tone: b.tone,
    }));

    doc.socialLinks = payload.socialLinks
      .filter((s) => s.platform.trim() && s.url.trim())
      .map((s) => ({
        platform: s.platform.trim(),
        url: s.url.trim(),
      }));

    doc.cvFile = payload.cvFileId ? new Types.ObjectId(payload.cvFileId) : undefined;
    doc.metaDescription = payload.metaDescription.trim().slice(0, 160);
    doc.socialImage = payload.socialImageId
      ? new Types.ObjectId(payload.socialImageId)
      : undefined;

    await doc.save();

    /* New referenced file IDs */
    const newFileIds = new Set<string>();
    if (doc.logo) newFileIds.add(String(doc.logo));
    if (doc.heroPortrait) newFileIds.add(String(doc.heroPortrait));
    if (doc.breakImage) newFileIds.add(String(doc.breakImage));
    if (doc.cvFile) newFileIds.add(String(doc.cvFile));
    if (doc.socialImage) newFileIds.add(String(doc.socialImage));

    /* Unlink removed files */
    for (const oldId of oldFileIds) {
      if (!newFileIds.has(oldId)) {
        await StoredFile.findByIdAndUpdate(oldId, {
          $pull: { usedBy: { model: "Settings", id: doc._id } },
        });
      }
    }

    /* Link newly attached files */
    for (const newId of newFileIds) {
      if (!oldFileIds.has(newId)) {
        await StoredFile.findByIdAndUpdate(newId, {
          $addToSet: { usedBy: { model: "Settings", id: doc._id } },
        });
      }
    }

    /* Revalidate public routes */
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/services");
    revalidatePath("/projects");
    revalidatePath("/blog");
    revalidatePath("/admin/branding");

    return { success: true };
  } catch (err) {
    console.error("[branding:save]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not save branding settings.",
    };
  }
}
