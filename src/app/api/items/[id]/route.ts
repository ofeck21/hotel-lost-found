import { NextResponse } from "next/server";
import { deleteItem, updateItem } from "@/lib/store";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LostFoundPayload } from "@/lib/types";

function normalizePayload(payload: Partial<LostFoundPayload>): LostFoundPayload | null {
  if (
    !payload.guestName ||
    !payload.checkIn ||
    !payload.checkOut ||
    !payload.itemName ||
    !payload.itemPhoto ||
    !payload.roomNumber ||
    !payload.remark ||
    !payload.createdBy ||
    !payload.status
  ) {
    return null;
  }

  return {
    guestName: payload.guestName,
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    itemName: payload.itemName,
    itemPhoto: payload.itemPhoto.trim(),
    roomNumber: payload.roomNumber,
    remark: payload.remark,
    createdBy: payload.createdBy,
    pickupHandle: payload.pickupHandle?.trim() ?? "",
    pickupDocumentation: payload.pickupDocumentation?.trim() ?? "",
    status: payload.status,
  };
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const payload = (await request.json()) as Partial<LostFoundPayload>;
    const pickupHandle = payload.pickupHandle?.trim() ?? "";
    const pickupDocumentation = payload.pickupDocumentation?.trim() ?? "";

    if (payload.status === "Sudah Diambil" && !pickupHandle) {
      return NextResponse.json(
        { message: "Pickup Handle wajib diisi jika status Sudah Diambil." },
        { status: 400 },
      );
    }

    if (payload.status === "Sudah Diambil" && !pickupDocumentation) {
      return NextResponse.json(
        { message: "Dokumentasi Pengambilan wajib diisi jika status Sudah Diambil." },
        { status: 400 },
      );
    }

    const normalizedPayload = normalizePayload(payload);

    if (!normalizedPayload) {
      return NextResponse.json({ message: "Data belum lengkap." }, { status: 400 });
    }

    const updated = await updateItem(id, normalizedPayload);
    if (!updated) {
      return NextResponse.json({ message: "Data tidak ditemukan." }, { status: 404 });
    }

    if (normalizedPayload.pickupHandle) {
      await prisma.pickupHandle.upsert({
        where: {
          name: normalizedPayload.pickupHandle,
        },
        update: {},
        create: {
          name: normalizedPayload.pickupHandle,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const removed = await deleteItem(id);

  if (!removed) {
    return NextResponse.json({ message: "Data tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
