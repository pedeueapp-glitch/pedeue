export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const coupons = await (prisma as any).coupon.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(coupons);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const body = await req.json();
    const { code, type, value, minOrderValue, maxUses, expiryDate, isActive, isCashback } = body;

    if (!code || !type || !value) {
      return NextResponse.json({ error: "Código, tipo e valor são obrigatórios" }, { status: 400 });
    }

    // Verifica se o código já existe
    const existing = await (prisma as any).coupon.findFirst({
      where: { code: code.toUpperCase(), storeId: store.id }
    });
    if (existing) return NextResponse.json({ error: "Código já cadastrado" }, { status: 400 });

    const coupon = await (prisma as any).coupon.create({
      data: {
        id: `cup_${Date.now()}`,
        storeId: store.id,
        code: code.toUpperCase().trim(),
        type,     // "PERCENT" | "FIXED"
        value: parseFloat(value),
        minOrderValue: parseFloat(minOrderValue || 0),
        maxUses: parseInt(maxUses || 0),
        usedCount: 0,
        isActive: isActive ?? true,
        isCashback: isCashback ?? false,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const body = await req.json();
    // Normaliza os nomes dos campos vindo do frontend se necessário
    const updateData: any = { ...body, updatedAt: new Date() };
    
    const coupon = await (prisma as any).coupon.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(coupon);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    await (prisma as any).coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

