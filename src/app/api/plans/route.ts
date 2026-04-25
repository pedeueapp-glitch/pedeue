export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" }
    });
    return NextResponse.json(plans);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao carregar planos" }, { status: 500 });
  }
}

