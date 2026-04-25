export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expenses = await (prisma as any).platform_expense.findMany({
    orderBy: { date: 'desc' }
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const expense = await (prisma as any).platform_expense.create({
      data: {
        title: data.title,
        amount: parseFloat(data.amount),
        type: data.type, // FIXED, VARIABLE, WITHDRAWAL
        date: new Date(data.date || Date.now())
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao salvar despesa" }, { status: 500 });
  }
}

