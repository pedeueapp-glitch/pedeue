import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const stores = await prisma.store.findMany({
    include: {
      subscription: { include: { plan: true } },
      user: { select: { name: true, email: true } },
      _count: { select: { order: true, product: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(stores);
}
