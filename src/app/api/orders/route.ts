export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { getCurrentStore } from "@/lib/get-store";

export async function GET(req: NextRequest) {
  try {
    const store = await getCurrentStore();

    if (!store) {
       return NextResponse.json([]); // Retorna array vazio se não houver loja
    }

    const { searchParams } = new URL(req.url);
    const cashierFrom = searchParams.get("cashierFrom");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const report = searchParams.get("report"); // "true" = não filtrar por tipo (relatório geral)

    const orderTypesMap: Record<string, any[]> = {
      RESTAURANT: ["DELIVERY", "PICKUP", "DINING_IN"],
      SHOWCASE: ["RETAIL"],
      SERVICE: ["SERVICE"]
    };

    const allowedTypes = orderTypesMap[store.storeType] || ["DELIVERY", "PICKUP", "DINING_IN"];

    // Montar filtro de datas
    const dateFilter: any = {};
    if (cashierFrom) {
      const from = new Date(cashierFrom);
      from.setMinutes(from.getMinutes() - 10); // Margem de segurança de 10 min para evitar perda por fuso/atraso de relógio
      dateFilter.gte = from;
    } else if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const whereClause: any = {
      storeId: store.id,
    };

    if (!report) {
      whereClause.orderType = { in: allowedTypes };
    }

    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }

    // Para relatório com paginação
    if (report === "true") {
      const skip = (page - 1) * limit;
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: whereClause,
          include: {
            items: { include: { product: true } },
            table: true,
            waiter: true
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.order.count({ where: whereClause })
      ]);
      return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) });
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: { include: { product: true } },
        table: true,
        waiter: true
      },
      orderBy: { createdAt: "desc" },
      take: 200
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json([]);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const body = await req.json();
    const { status } = body;
    
    // Tenta pegar o ID tanto do body quanto da URL para maior compatibilidade
    const url = new URL(req.url);
    const orderIdFromUrl = url.pathname.split("/").pop();
    const orderId = body.orderId || (orderIdFromUrl !== 'orders' ? orderIdFromUrl : null);

    if (!orderId) {
      return NextResponse.json({ error: "ID do pedido nao fornecido" }, { status: 400 });
    }

    const store = await getCurrentStore();
    if (!store) return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });

    const order = await prisma.order.update({
      where: { 
        id: orderId, 
        storeId: store.id 
      },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json({ error: "Falha na atualização" }, { status: 500 });
  }
}
