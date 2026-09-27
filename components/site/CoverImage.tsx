import Image from "next/image";
import type { ImageView } from "@/lib/project-view";
import { cn } from "@/lib/utils";
import { ImageGlyph } from "./icons";

/**
 * An uploaded image filling the box it is put in, or the design's placeholder
 * glyph when there is none yet — an unsaved draft in the admin preview.
 *
 * Always through next/image with the file's real width and height (CLAUDE.md
 * rule 8), so the browser reserves the space before it loads. SVG is served as
 * it is: the image optimiser does not rasterise SVG, and ours are the seed's
 * placeholder covers, written by us.
 */
export function CoverImage({
  image,
  sizes,
  eager = false,
  className,
  placeholderSize = 44,
}: {
  image: ImageView | null;
  sizes: string;
  /** The largest image in the first screen: load it first, not lazily. */
  eager?: boolean;
  className?: string;
  placeholderSize?: number;
}) {
  if (!image) {
    return (
      <ImageGlyph size={placeholderSize} className="text-placeholder-ink" />
    );
  }

  return (
    <Image
      src={image.url}
      width={image.width}
      height={image.height}
      alt={image.alt}
      sizes={sizes}
      loading={eager ? "eager" : undefined}
      fetchPriority={eager ? "high" : undefined}
      unoptimized={image.mimeType === "image/svg+xml"}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
