import { ImageResponse } from "next/og";
import { dollars } from "@/lib/money";
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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#14201c",
          color: "#eef6f2",
          padding: 48,
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            border: "2px solid #2c4038",
            borderRadius: 32,
            overflow: "hidden",
            background: "#1b2a25",
          }}
        >
          <img
            src={photo}
            alt=""
            width={480}
            height={534}
            style={{ width: 480, height: 534, objectFit: "cover" }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 48,
              flex: 1,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 22, color: "#1bb888", fontWeight: 700 }}>PetThrone</div>
              <div style={{ fontSize: 28, marginTop: 8, color: "#9aafa6" }}>
                {pet.rank ? `#${pet.rank}` : "Unranked"}
              </div>
              <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, marginTop: 12 }}>
                {pet.name}
              </div>
              <div style={{ fontSize: 26, color: "#9aafa6", marginTop: 16 }}>
                {pet.boast || "The richest pet on the web"}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 20, color: "#9aafa6" }}>Total</div>
              <div style={{ fontSize: 56, fontWeight: 800, color: "#1bb888" }}>
                {dollars(pet.totalCents)}
              </div>
              <div style={{ fontSize: 20, color: "#9aafa6", marginTop: 8 }}>
                {pet.ownerName}
                {pet.country ? ` · ${pet.country}` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
