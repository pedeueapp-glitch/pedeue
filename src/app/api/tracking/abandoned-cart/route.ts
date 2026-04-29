import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      id, // Session ID
      storeId, 
      customerName, 
      customerPhone, 
      items, 
      total, 
      lastStep, 
      exitScreen, 
      durationSeconds 
    } = body;

    if (!storeId || !items || items.length === 0) {
      return NextResponse.json({ success: true });
    }

    const cartData = {
      storeId,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      items: JSON.stringify(items),
      total: total || 0,
      lastStep: lastStep || "CART",
      exitScreen: exitScreen || "MENU",
      durationSeconds: durationSeconds || 0,
      abandonedAt: new Date(),
    };

    if (id) {
        await prisma.abandonedcart.upsert({
            where: { id },
            update: cartData,
            create: { ...cartData, id }
        });
    } else {
        const created = await prisma.abandonedcart.create({ data: cartData });
        return NextResponse.json({ success: true, id: created.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (id) {
            await prisma.abandonedcart.delete({ where: { id } }).catch(() => {});
        }
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: true });
    }
}
