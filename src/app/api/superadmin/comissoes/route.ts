export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — listar todas as comissões de afiliados
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const commissions = await prisma.affiliate_commission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        platformAffiliate: {
          select: {
            id: true,
            name: true,
            email: true,
            pixKey: true,
            pixKeyType: true,
          }
        }
      }
    });

    return NextResponse.json({ commissions });
  } catch (error) {
    console.error("[SUPERADMIN/COMISSOES GET]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
