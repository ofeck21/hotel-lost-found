import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getUploadsDir, uploadUrlFromFileName } from "@/lib/uploads";

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ message: "File tidak ditemukan." }, { status: 400 });
  }

  const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!acceptedTypes.includes(file.type)) {
    return NextResponse.json({ message: "Format file harus JPG, PNG, atau WEBP." }, { status: 400 });
  }

  const uploadDir = getUploadsDir();
  await mkdir(uploadDir, { recursive: true });

  const extByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = extByType[file.type] ?? "jpg";
  const fileName = `${randomUUID()}.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return NextResponse.json({ url: uploadUrlFromFileName(fileName) });
}
