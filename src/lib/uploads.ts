import path from "node:path";

const API_UPLOAD_PREFIX = "/api/uploads/";
const LEGACY_UPLOAD_PREFIX = "/uploads/";

export function getUploadsDir(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (!configured) {
    return path.join(process.cwd(), "public", "uploads");
  }

  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

export function uploadUrlFromFileName(fileName: string): string {
  return `${API_UPLOAD_PREFIX}${encodeURIComponent(fileName)}`;
}

export function extractUploadFileName(fileUrl: string): string | null {
  if (!fileUrl) {
    return null;
  }

  const cleaned = fileUrl.trim();
  if (!cleaned) {
    return null;
  }

  const fromPath = extractFromPath(cleaned);
  if (fromPath) {
    return fromPath;
  }

  try {
    const parsed = new URL(cleaned);
    return extractFromPath(parsed.pathname);
  } catch {
    return null;
  }
}

function extractFromPath(input: string): string | null {
  const noQuery = input.split("?")[0];

  if (noQuery.startsWith(API_UPLOAD_PREFIX)) {
    return decodeAndValidate(noQuery.slice(API_UPLOAD_PREFIX.length));
  }

  if (noQuery.startsWith(LEGACY_UPLOAD_PREFIX)) {
    return decodeAndValidate(noQuery.slice(LEGACY_UPLOAD_PREFIX.length));
  }

  return null;
}

function decodeAndValidate(raw: string): string | null {
  const decoded = decodeURIComponent(raw).trim();
  if (!decoded || decoded.includes("/") || decoded.includes("\\")) {
    return null;
  }

  return decoded;
}