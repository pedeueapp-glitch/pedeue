export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryStoreId = searchParams.get("storeId");

    let storeId: string | null = null;

    if (queryStoreId) {
      // Se houver queryStoreId, pode ser um garçom. Validamos o token se não houver sessão.
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded: any = verify(token, process.env.NEXTAUTH_SECRET || "fallback-secret");
          if (decoded.storeId === queryStoreId) {
            storeId = queryStoreId;
          }
        } catch (err) {
          return NextResponse.json({ error: "Token inválido" }, { status: 401 });
        }
      }
      
      if (!storeId) {
        // Fallback para sessão de lojista se o token falhar ou não existir
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
          const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
          if (store && store.id === queryStoreId) storeId = store.id;
        }
      }
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
      const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
      if (!store) return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });
      storeId = store.id;
    }

    if (!storeId) return NextResponse.json({ error: "ID da loja necessário" }, { status: 400 });

    const [tables, settings] = await Promise.all([
      prisma.table.findMany({
        where: { storeId },
        orderBy: { number: 'asc' },
        include: {
          order: {
            where: { status: { notIn: ['DONE', 'CANCELED'] } }
          }
        }
      }),
      prisma.pdvsettings.findUnique({ where: { storeId } })
    ]);

    if (queryStoreId) {
      return NextResponse.json({ tables, settings });
    } else {
      return NextResponse.json(tables);
    }
  } catch (error: any) {
    console.error("API TABLES GET ERROR:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
    if (!store) return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });

    const { number, capacity, isActive } = await req.json();

    const existingTable = await prisma.table.findFirst({
      where: { 
          number: String(number),
          storeId: store.id
      }
    });

    if (existingTable) {
      return NextResponse.json({ error: "Mesa já existe" }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: {
        id: `table_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        number: String(number),
        capacity: capacity ? parseInt(capacity) : null,
        isActive: isActive !== undefined ? isActive : true,
        storeId: store.id,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(table);
  } catch (error: any) {
    console.error("API TABLES POST ERROR:", error);
    return NextResponse.json({ error: "Erro ao criar mesa" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    await prisma.table.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("TABLES_DELETE_ERROR:", error);
    return NextResponse.json({ error: "Falha ao excluir mesa" }, { status: 500 });
  }
}

