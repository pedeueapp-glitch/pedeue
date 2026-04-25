import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findUnique({
    where: { userId: session.user.id },
  });

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const rules = await prisma.upsell_rule.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: 'desc' }
  });

  // Buscar nomes dos produtos para facilitar o front
  const productIds = Array.from(new Set(rules.flatMap(r => [r.triggerProductId, r.suggestProductId])));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true }
  });

  const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));

  const enrichedRules = rules.map(rule => ({
    ...rule,
    triggerProductName: productMap[rule.triggerProductId] || "Produto Removido",
    suggestProductName: productMap[rule.suggestProductId] || "Produto Removido"
  }));

  return NextResponse.json(enrichedRules);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const store = await prisma.store.findUnique({ where: { userId: session!.user.id } });
  
  const { name, triggerProductId, suggestProductId, discountPrice } = await req.json();

  const rule = await prisma.upsell_rule.create({
    data: {
      name,
      triggerProductId,
      suggestProductId,
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      storeId: store!.id
    }
  });

  return NextResponse.json(rule);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await prisma.upsell_rule.delete({ where: { id: id! } });
  return NextResponse.json({ success: true });
}
