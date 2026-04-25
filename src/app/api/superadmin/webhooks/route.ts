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

  const logs = await prisma.webhook_log.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return NextResponse.json({ logs });
}

/**
 * Função utilitária para registrar webhooks recebidos
 */
export async function recordWebhook(provider: string, event: string, payload: any, status: number = 200) {
  try {
    await prisma.webhook_log.create({
      data: {
        provider,
        event,
        payload: JSON.stringify(payload),
        status
      }
    });
  } catch (e) {
    console.error("FAILED_TO_RECORD_WEBHOOK:", e);
  }
}
