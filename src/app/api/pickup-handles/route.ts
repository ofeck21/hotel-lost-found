import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const handles = await prisma.pickupHandle.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      name: true,
    },
  });

  return NextResponse.json(handles.map((item: { name: string }) => item.name));
}
