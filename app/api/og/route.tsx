import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get("title") || "Garsame Mohamud";
    const type = searchParams.get("type") || "portfolio";
    const category = searchParams.get("category") || "";
    const description =
      searchParams.get("description") ||
      "Senior Software Engineer in Mogadishu building fast, resilient web systems.";

    let typeBadge = "PORTFOLIO";
    if (type === "project") typeBadge = "CASE STUDY";
    if (type === "post" || type === "blog") typeBadge = "ARTICLE";
    if (category) typeBadge = category.toUpperCase();

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#0E1533",
            backgroundImage:
              "radial-gradient(circle at 90% 10%, rgba(61, 90, 241, 0.25) 0%, transparent 60%), radial-gradient(circle at 10% 90%, rgba(61, 90, 241, 0.15) 0%, transparent 50%)",
            padding: "56px 64px",
            fontFamily: "system-ui, sans-serif",
            color: "#FFFFFF",
          }}
        >
          {/* Top Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#FFFFFF",
                }}
              >
                GARSAME
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  backgroundColor: "#3D5AF1",
                  padding: "4px 8px",
                  borderRadius: "3px",
                }}
              >
                v3
              </span>
            </div>

            <span
              style={{
                fontSize: "13px",
                fontFamily: "monospace",
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "#9BB1FF",
                backgroundColor: "rgba(61, 90, 241, 0.18)",
                border: "1px solid rgba(61, 90, 241, 0.4)",
                padding: "6px 14px",
                borderRadius: "999px",
              }}
            >
              {typeBadge}
            </span>
          </div>

          {/* Main Title & Description */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              maxWidth: "980px",
            }}
          >
            <div
              style={{
                fontSize: title.length > 50 ? "46px" : "56px",
                fontWeight: 800,
                lineHeight: 1.18,
                letterSpacing: "-0.025em",
                color: "#FFFFFF",
              }}
            >
              {title}
            </div>
            {description && (
              <div
                style={{
                  fontSize: "22px",
                  lineHeight: 1.5,
                  color: "#97A2C0",
                }}
              >
                {description.length > 140
                  ? `${description.slice(0, 140)}...`
                  : description}
              </div>
            )}
          </div>

          {/* Bottom Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(228, 232, 247, 0.12)",
              paddingTop: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "15px",
                fontFamily: "monospace",
                color: "#3D5AF1",
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#10B981",
                }}
              />
              garsame.so
            </div>

            <div
              style={{
                fontSize: "15px",
                color: "#7D89AE",
                fontWeight: 500,
              }}
            >
              Garsame Mohamud · Software Engineer · Mogadishu
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(`Failed to generate the image: ${msg}`, {
      status: 500,
    });
  }
}
