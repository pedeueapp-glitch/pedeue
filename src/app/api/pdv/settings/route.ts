export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Busca configurações do PDV
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    // Busca ou cria configurações do PDV para esta loja
    let settings = await (prisma as any).pdvsettings.findFirst({
      where: { storeId: store.id }
    });

    if (!settings) {
      settings = await (prisma as any).pdvsettings.create({
        data: {
          id: `pdvset_${Date.now()}`,
          storeId: store.id,
          soundEnabled: true,
          notificationSound: "notification.mp3",
          autoPrint: false,
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("PDV_SETTINGS_GET_ERROR:", error);
    // Se a tabela não existir ainda, retorna default
    return NextResponse.json({ soundEnabled: true, autoPrint: false });
  }
}

// PATCH - Atualiza configurações do PDV
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

    const { soundEnabled, autoPrint, notificationSound } = await req.json();

    const settings = await (prisma as any).pdvsettings.upsert({
      where: { storeId: store.id },
      update: { soundEnabled, autoPrint, notificationSound, updatedAt: new Date() },
      create: {
        id: `pdvset_${Date.now()}`,
        storeId: store.id,
        soundEnabled: soundEnabled ?? true,
        notificationSound: notificationSound ?? "notification.mp3",
        autoPrint: autoPrint ?? false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

