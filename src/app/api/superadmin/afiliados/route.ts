export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET — listar todos os afiliados
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const affiliates = await prisma.platform_affiliate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            isActive: true,
            subscription: { select: { status: true } },
          },
        },
        commissions: {
          select: { amount: true, status: true },
        },
      },
    });

    const enriched = affiliates.map((a) => ({
      ...a,
      totalStores: a.stores.length,
      activeStores: a.stores.filter(s => s.isActive && s.subscription?.status === "ACTIVE").length,
      totalPaid: a.commissions.filter(c => c.status === "PAID").reduce((acc, c) => acc + c.amount, 0),
      totalPending: a.commissions.filter(c => c.status === "PENDING").reduce((acc, c) => acc + c.amount, 0),
      totalRequested: a.commissions.filter(c => c.status === "REQUESTED").reduce((acc, c) => acc + c.amount, 0),
    }));

    return NextResponse.json({ affiliates: enriched });
  } catch (error) {
    console.error("[SUPERADMIN/AFILIADOS GET]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST — cadastrar novo afiliado
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { name, email, password, pixKey, pixKeyType, commissionRate } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email já em uso" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
        role: "AFFILIATE",
        updatedAt: new Date(),
        platformAffiliate: {
          create: {
            name,
            email,
            pixKey: pixKey || null,
            pixKeyType: pixKeyType || "CPF",
            commissionRate: commissionRate ?? 0.10,
            updatedAt: new Date(),
          },
        },
      },
      include: { platformAffiliate: true },
    });

    return NextResponse.json(
      { message: "Afiliado cadastrado com sucesso!", affiliate: user.platformAffiliate },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SUPERADMIN/AFILIADOS POST]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
