import { cn } from "@/lib/utils";

/**
 * Page gutters plus the content cap.
 *
 * Two layers on purpose. The outer holds the gutter — 120px desktop, 24px
 * mobile — and the inner caps content at 1200px and centres it. On a 1440px
 * screen that lands at exactly the 1200px the approved screens are drawn at;
 * on anything wider the gutter grows instead of the text measure.
 *
 * The gutter switches at 1024px — docs/02-DESIGN-SYSTEM.md.
 */
export function Container({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={cn("px-gutter-sm lg:px-gutter", className)}>
      <div className={cn("mx-auto w-full max-w-content", innerClassName)}>
        {children}
      </div>
    </div>
  );
}
