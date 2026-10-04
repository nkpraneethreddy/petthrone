import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");
const MAX_BYTES = 4_000_000;

// SVG is deliberately excluded: it can carry scripts and would run on our own
// origin when served back from /api/uploads.
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAGIC: { ext: string; test: (b: Buffer) => boolean }[] = [
  { ext: ".jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: ".png",
    test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  { ext: ".gif", test: (b) => b.subarray(0, 3).toString("ascii") === "GIF" },
  {
    ext: ".webp",
    test: (b) =>
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

export async function saveUpload(file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error("Photo must be under 4MB.");
  }
  if (!ALLOWED[file.type]) {
    throw new Error("Photos must be JPEG, PNG, WebP, or GIF.");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) {
    throw new Error("Photo must be under 4MB.");
  }

  // Trust the bytes, not the declared type.
  const sniffed = MAGIC.find((m) => m.test(buf));
  if (!sniffed) {
    throw new Error("That file is not a valid image.");
  }

  const id = `${randomUUID()}${sniffed.ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, id), buf);
  return `/api/uploads/${id}`;
}
