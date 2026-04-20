import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        whatsapp: body.whatsapp,
        isActive: body.isActive,
        isOpen: body.isOpen,
        primaryColor: body.primaryColor,
        deliveryFee: body.deliveryFee !== undefined ? parseFloat(body.deliveryFee) : undefined,
        minOrderValue: body.minOrderValue !== undefined ? parseFloat(body.minOrderValue) : undefined,
      }
    });

    return NextResponse.json(updatedStore);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.store.delete({ where: { id } });

    return NextResponse.json({ message: "Loja removida com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
