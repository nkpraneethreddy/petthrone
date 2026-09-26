import { ImageResponse } from "next/og";
import { getPet } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pet = await getPet(id);
  if (!pet) {
    return new Response("Not found", { status: 404 });
  }

  const origin = new URL(req.url).origin;
  const photoPath = pet.photoUrl || "";
  const photo = photoPath.startsWith("http") ? photoPath : `${origin}${photoPath}`;
  const snapshot = new Date().toISOString().replace("T", " ").slice(0, 16);
  const requestUrl = new URL(req.url);
  const headers =
    requestUrl.searchParams.get("download") === "1"
      ? { "Content-Disposition": `attachment; filename="${pet.id}-petthrone-card.png"` }
      : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#121512",
          color: "#f5f1e8",
          padding: 36,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            flexDirection: "column",
            alignItems: "center",
            border: "2px solid #c8aa62",
            padding: "66px 72px 48px",
            background: "#121512",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#d7bb78",
              fontSize: 20,
              letterSpacing: 2,
            }}
          >
            PETTHRONE
          </div>

          <div
            style={{
              display: "flex",
              width: 390,
              height: 390,
              marginTop: 78,
              borderRadius: 195,
              padding: 18,
              background: "#2b372d",
              border: "18px solid #1e2921",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt=""
              width={354}
              height={354}
              style={{
                width: 354,
                height: 354,
                borderRadius: 177,
                objectFit: "cover",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 38,
              fontFamily: "Georgia, serif",
              fontSize: 68,
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            {pet.name}
          </div>

          <div style={{ display: "flex", marginTop: 34, fontSize: 27 }}>
            {pet.rank ? `#${pet.rank} worldwide` : "Unranked"}
          </div>

          {pet.boast ? (
            <div
              style={{
                display: "flex",
                maxWidth: 690,
                marginTop: 30,
                color: "#c8c8c0",
                fontSize: 22,
                lineHeight: 1.4,
                textAlign: "center",
              }}
            >
              {pet.boast}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              marginTop: "auto",
              color: "#c8c8c0",
              fontSize: 16,
              letterSpacing: 1,
            }}
          >
            Snapshot {snapshot} UTC
          </div>
        </div>
      </div>
    ),
    { width: 1024, height: 1024, headers },
  );
}
