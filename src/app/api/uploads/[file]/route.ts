import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { Readable } from "stream";

export async function GET(
  _req: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  if (!file || file.includes("..") || file.includes("/") || file.includes("\\")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const full = path.join(process.cwd(), ".data", "uploads", file);
  try {
    await stat(full);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const stream = createReadStream(full);
  const type = file.endsWith(".png")
    ? "image/png"
    : file.endsWith(".webp")
      ? "image/webp"
      : file.endsWith(".svg")
        ? "image/svg+xml"
        : "image/jpeg";
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
