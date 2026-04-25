export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { days } = await req.json();
    const { id: subId } = await params;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subId }
    });

    if (!subscription) return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });

    let currentExpiry = new Date(subscription.expiresAt);
    if (currentExpiry < new Date()) currentExpiry = new Date(); // Se já venceu, começa de hoje

    currentExpiry.setDate(currentExpiry.getDate() + parseInt(days));

    const updated = await prisma.subscription.update({
      where: { id: subId },
      data: { 
        expiresAt: currentExpiry,
        status: "ACTIVE",
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
