import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  return NextResponse.json({ authenticated: Boolean(userId), userId });
}
