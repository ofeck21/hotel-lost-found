import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { LostFoundItem, LostFoundPayload } from "@/lib/types";

type DbLostFoundItem = {
  id: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  itemName: string;
  itemPhoto: string;
  roomNumber: string;
  remark: string;
  createdBy: string;
  pickupHandle: string;
  pickupDocumentation: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function toDomain(item: DbLostFoundItem): LostFoundItem {
  return {
    id: item.id,
    guestName: item.guestName,
    checkIn: item.checkIn.toISOString(),
    checkOut: item.checkOut.toISOString(),
    itemName: item.itemName,
    itemPhoto: item.itemPhoto,
    roomNumber: item.roomNumber,
    remark: item.remark as LostFoundItem["remark"],
    createdBy: item.createdBy,
    pickupHandle: item.pickupHandle,
    pickupDocumentation: item.pickupDocumentation,
    status: item.status as LostFoundItem["status"],
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

async function deleteUploadAsset(fileUrl: string): Promise<void> {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) {
    return;
  }

  const fileName = path.basename(fileUrl.split("?")[0]);
  if (!fileName) {
    return;
  }

  const filePath = path.join(process.cwd(), "public", "uploads", fileName);

  try {
    await unlink(filePath);
  } catch (error) {
    // Ignore missing files; deletion should still succeed for DB record.
    if (!(error instanceof Error) || !("code" in error) || (error as { code?: string }).code !== "ENOENT") {
      throw error;
    }
  }
}

export async function getAllItems(): Promise<LostFoundItem[]> {
  const items = await prisma.lostFoundItem.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return items.map(toDomain);
}

export async function createItem(payload: LostFoundPayload): Promise<LostFoundItem> {
  const created = await prisma.lostFoundItem.create({
    data: {
      guestName: payload.guestName,
      checkIn: new Date(payload.checkIn),
      checkOut: new Date(payload.checkOut),
      itemName: payload.itemName,
      itemPhoto: payload.itemPhoto,
      roomNumber: payload.roomNumber,
      remark: payload.remark,
      createdBy: payload.createdBy,
      pickupHandle: payload.pickupHandle,
      pickupDocumentation: payload.pickupDocumentation,
      status: payload.status,
    },
  });

  return toDomain(created);
}

export async function updateItem(id: string, payload: LostFoundPayload): Promise<LostFoundItem | null> {
  const existing = await prisma.lostFoundItem.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  const updated = await prisma.lostFoundItem.update({
    where: { id },
    data: {
      guestName: payload.guestName,
      checkIn: new Date(payload.checkIn),
      checkOut: new Date(payload.checkOut),
      itemName: payload.itemName,
      itemPhoto: payload.itemPhoto,
      roomNumber: payload.roomNumber,
      remark: payload.remark,
      createdBy: payload.createdBy,
      pickupHandle: payload.pickupHandle,
      pickupDocumentation: payload.pickupDocumentation,
      status: payload.status,
    },
  });

  if (existing.itemPhoto !== payload.itemPhoto) {
    await deleteUploadAsset(existing.itemPhoto);
  }

  if (existing.pickupDocumentation !== payload.pickupDocumentation) {
    await deleteUploadAsset(existing.pickupDocumentation);
  }

  return toDomain(updated);
}

export async function deleteItem(id: string): Promise<boolean> {
  const existing = await prisma.lostFoundItem.findUnique({ where: { id } });
  if (!existing) {
    return false;
  }

  await prisma.lostFoundItem.delete({ where: { id } });
  await deleteUploadAsset(existing.itemPhoto);
  await deleteUploadAsset(existing.pickupDocumentation);
  return true;
}
