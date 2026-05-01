import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    return NextResponse.json({ authenticated: Boolean(userId), userId });
  } catch {
    return NextResponse.json({ authenticated: false, userId: null });
  }
}
