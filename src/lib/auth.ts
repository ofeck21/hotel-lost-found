import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "lf_auth";

const LOGIN_USERNAME = process.env.LOGIN_USERNAME ?? "admin";
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD ?? "hotel123";
const AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET ?? "lostfound-session-secret";

function signUserId(userId: string): string {
  return createHash("sha256").update(`${userId}:${AUTH_SESSION_SECRET}`).digest("hex");
}

export function createSessionToken(userId: string): string {
  const signature = signUserId(userId);
  return `${userId}.${signature}`;
}

function parseSessionToken(token: string): string | null {
  const [userId, signature] = token.split(".");
  if (!userId || !signature) {
    return null;
  }

  const expectedSignature = signUserId(userId);
  return signature === expectedSignature ? userId : null;
}

export async function ensureDefaultUser(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { username: LOGIN_USERNAME },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  const passwordHash = await hash(LOGIN_PASSWORD, 10);
  await prisma.user.create({
    data: {
      username: LOGIN_USERNAME,
      passwordHash,
    },
  });
}

export async function validateCredentials(username: string, password: string): Promise<{ valid: boolean; userId?: string }> {
  await ensureDefaultUser();

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return { valid: false };
  }

  const validPassword = await compare(password, user.passwordHash);
  if (!validPassword) {
    return { valid: false };
  }

  return { valid: true, userId: user.id };
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const userId = parseSessionToken(token);
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return user ? userId : null;
}

export async function isAuthenticated(): Promise<boolean> {
  const userId = await getAuthenticatedUserId();
  return Boolean(userId);
}

export async function updatePasswordByUserId(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
    },
  });
  if (!user) {
    return false;
  }

  const validCurrentPassword = await compare(currentPassword, user.passwordHash);
  if (!validCurrentPassword) {
    return false;
  }

  const newPasswordHash = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  return true;
}
