import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Listar variantes de um produto
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json([], { status: 200 });

  const variants = await (prisma as any).product_variant.findMany({
    where: { productId },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json(variants.map((v: any) => ({
    ...v,
    sizes: JSON.parse(v.sizes || "[]")
  })));
}

// POST: Criar variante
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const variant = await (prisma as any).product_variant.create({
    data: {
      productId: data.productId,
      color: data.color,
      colorHex: data.colorHex || "#000000",
      sizes: JSON.stringify(data.sizes || []),
      imageUrl: data.imageUrl || null,
      stock: parseInt(data.stock || "0"),
      barcode: data.barcode || null
    }
  });

  return NextResponse.json({ ...variant, sizes: data.sizes }, { status: 201 });
}

// DELETE: Excluir variante
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await (prisma as any).product_variant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
