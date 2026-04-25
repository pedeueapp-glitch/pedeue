import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const isSuperAdmin = session.user.role === "SUPERADMIN";

    const tickets = await prisma.support_ticket.findMany({
      where: isSuperAdmin ? {} : { userId: session.user.id },
      include: {
        user: { select: { name: true, email: true, image: true } },
        store: { select: { name: true, slug: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("GET TICKETS ERROR:", error);
    return NextResponse.json({ error: "Erro ao buscar tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { subject, message, priority } = body;

    // Buscar loja do usuário
    const store = await prisma.store.findUnique({
      where: { userId: session.user.id }
    });

    const ticket = await prisma.support_ticket.create({
      data: {
        subject,
        priority: priority || "MEDIUM",
        userId: session.user.id,
        storeId: store?.id,
        messages: {
          create: {
            content: message,
            senderId: session.user.id,
          }
        }
      }
    });

    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar ticket" }, { status: 500 });
  }
}
