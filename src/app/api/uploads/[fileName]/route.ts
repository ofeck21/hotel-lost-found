import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { extractUploadFileName, getUploadsDir } from "@/lib/uploads";

function contentTypeFromName(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> },
) {
  const { fileName } = await params;
  const resolvedName = extractUploadFileName(`/uploads/${fileName}`);

  if (!resolvedName) {
    return NextResponse.json({ message: "File tidak valid." }, { status: 400 });
  }

  const filePath = path.join(getUploadsDir(), resolvedName);

  try {
    const fileBuffer = await readFile(filePath);
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentTypeFromName(resolvedName),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ message: "File tidak ditemukan." }, { status: 404 });
  }
}