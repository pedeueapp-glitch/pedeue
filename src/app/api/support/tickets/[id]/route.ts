import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { status, priority } = body;

    const ticket = await prisma.support_ticket.findUnique({
      where: { id }
    });

    if (!ticket) return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });

    // Apenas Super Admin ou o próprio usuário podem atualizar
    if (session.user.role !== "SUPERADMIN" && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const updatedTicket = await prisma.support_ticket.update({
      where: { id },
      data: {
        status,
        priority,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar ticket" }, { status: 500 });
  }
}
