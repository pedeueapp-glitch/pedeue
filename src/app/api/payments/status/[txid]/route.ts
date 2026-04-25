import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ txid: string }> }
) {
  try {
    const { txid } = await params;

    // Usando findFirst em vez de findUnique para ser mais resiliente caso o índice não esteja pronto
    const transaction = await (prisma as any).platform_transaction.findFirst({
      where: { externalId: txid }
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ 
      status: transaction.status,
      confirmed: transaction.status === "paid"
    });

  } catch (error) {
    console.error("PAYMENT STATUS API ERROR:", error);
    return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 });
  }
}
