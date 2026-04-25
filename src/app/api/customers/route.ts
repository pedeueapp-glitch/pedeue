export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    let storeId = searchParams.get("storeId");

    if (!storeId && session?.user?.id) {
        const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
        storeId = store?.id || null;
    }

    if (!storeId) {
      return NextResponse.json({ error: "StoreId não encontrado" }, { status: 400 });
    }

    if (phone) {
        const customer = await prisma.customer.findUnique({
          where: { 
            phone_storeId: {
              phone,
              storeId
            }
          }
        });
        return NextResponse.json(customer);
    }

    const customers = await prisma.customer.findMany({
        where: { storeId },
        orderBy: { name: "asc" }
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("CUSTOMER_GET_ERROR:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { phone, name, street, number, complement, neighborhood, city, reference, storeId } = body;

    if (!storeId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const store = await prisma.store.findUnique({ where: { userId: session.user.id } });
        storeId = store?.id;
      }
    }

    if (!phone || !storeId || !name) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    // Tenta encontrar o cliente primeiro por causa de possíveis inconsistências de cache do Prisma
    const existingCustomer = await prisma.customer.findUnique({
      where: { 
        phone_storeId: {
          phone,
          storeId
        }
      }
    });

    let customer;

    if (existingCustomer) {
      customer = await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          name,
          street,
          number,
          complement,
          neighborhood,
          city,
          reference,
          updatedAt: new Date()
        }
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          id: crypto.randomUUID(),
          phone,
          name,
          street,
          number,
          complement,
          neighborhood,
          city,
          reference,
          store: { connect: { id: storeId } },
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("CUSTOMER_POST_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

