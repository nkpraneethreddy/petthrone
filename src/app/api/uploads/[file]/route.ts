import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { Readable } from "stream";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

export async function GET(
  _req: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  const notFound = NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the exact `uuid.ext` shape we generate on upload.
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp|gif)$/i.test(file || "")) {
    return notFound;
  }

  const full = path.join(UPLOAD_DIR, file);
  if (path.dirname(full) !== UPLOAD_DIR) return notFound;

  let size: number;
  try {
    size = (await stat(full)).size;
  } catch {
    return notFound;
  }

  const stream = createReadStream(full);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": TYPES[path.extname(full).toLowerCase()] || "application/octet-stream",
      "Content-Length": String(size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; sandbox",
    },
  });
}
