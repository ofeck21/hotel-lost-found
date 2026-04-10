import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createSessionToken, validateCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };

    if (!body.username || !body.password) {
      return NextResponse.json({ message: "Username dan password wajib diisi." }, { status: 400 });
    }

    const result = await validateCredentials(body.username, body.password);
    if (!result.valid || !result.userId) {
      return NextResponse.json({ message: "Kredensial tidak valid." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_COOKIE_NAME, createSessionToken(result.userId), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    const prismaCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (prismaCode === "P2021" || prismaCode === "P2022") {
      return NextResponse.json(
        { message: "Schema database belum sinkron. Jalankan npm run db:push lalu npm run prisma:generate." },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Terjadi kesalahan server saat login." }, { status: 500 });
  }
}
