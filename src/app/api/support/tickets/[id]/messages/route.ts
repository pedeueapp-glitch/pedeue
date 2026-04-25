import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const ticket = await prisma.support_ticket.findUnique({
      where: { id },
      include: {
        messages: {
          include: {
            sender: { select: { name: true, role: true, image: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!ticket) return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });

    // Verificar se o usuário tem permissão para ver este ticket
    if (session.user.role !== "SUPERADMIN" && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { content, attachmentUrl } = body;

    const ticket = await prisma.support_ticket.findUnique({
      where: { id }
    });

    if (!ticket) return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });

    // Criar mensagem
    const message = await prisma.support_message.create({
      data: {
        content,
        attachmentUrl,
        ticketId: id,
        senderId: session.user.id
      }
    });

    // Atualizar updatedAt do ticket e status se for superadmin respondendo
    await prisma.support_ticket.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        status: session.user.role === "SUPERADMIN" ? "IN_PROGRESS" : "OPEN"
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}
