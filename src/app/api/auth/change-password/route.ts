import { NextResponse } from "next/server";
import { getAuthenticatedUserId, updatePasswordByUserId } from "@/lib/auth";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  if (!body.currentPassword || !body.newPassword || !body.confirmPassword) {
    return NextResponse.json({ message: "Semua field password wajib diisi." }, { status: 400 });
  }

  if (body.newPassword.length < 6) {
    return NextResponse.json({ message: "Password baru minimal 6 karakter." }, { status: 400 });
  }

  if (body.newPassword !== body.confirmPassword) {
    return NextResponse.json({ message: "Konfirmasi password tidak sama." }, { status: 400 });
  }

  const updated = await updatePasswordByUserId(userId, body.currentPassword, body.newPassword);
  if (!updated) {
    return NextResponse.json({ message: "Password saat ini tidak valid." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
