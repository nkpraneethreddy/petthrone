import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

export async function saveUpload(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.byteLength > 4_000_000) {
    throw new Error("Photo must be under 4MB.");
  }
  const ext = extOf(file.type, file.name);
  const id = `${randomUUID()}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, id), buf);
  return `/api/uploads/${id}`;
}

function extOf(type: string, name: string) {
  if (type.includes("png")) return ".png";
  if (type.includes("webp")) return ".webp";
  if (type.includes("gif")) return ".gif";
  if (type.includes("svg")) return ".svg";
  if (name.toLowerCase().endsWith(".png")) return ".png";
  return ".jpg";
}
