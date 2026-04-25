import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = await prisma.support_ticket.findMany({
    include: {
      user: { select: { name: true, email: true } },
      store: { select: { name: true } },
      messages: { orderBy: { createdAt: 'asc' } }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return NextResponse.json({ tickets });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status, priority } = await req.json();

  const ticket = await prisma.support_ticket.update({
    where: { id },
    data: { status, priority }
  });

  return NextResponse.json(ticket);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticketId, content } = await req.json();

  const message = await prisma.support_message.create({
    data: {
      ticketId,
      senderId: session.user.id,
      content
    }
  });

  await prisma.support_ticket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() }
  });

  return NextResponse.json(message);
}
