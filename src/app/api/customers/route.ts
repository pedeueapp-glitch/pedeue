import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const storeId = searchParams.get("storeId");

    if (!phone || !storeId) {
      console.warn("CUSTOMER_GET_MISSING_PARAMS", { phone, storeId });
      return NextResponse.json(null);
    }

    const customer = await prisma.customer.findUnique({
      where: { 
        phone_storeId: {
          phone,
          storeId
        }
      }
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("CUSTOMER_GET_ERROR:", error);
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, street, number, complement, neighborhood, reference, storeId } = body;

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
          reference,
        }
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          phone,
          name,
          street,
          number,
          complement,
          neighborhood,
          reference,
          storeId
        }
      });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("CUSTOMER_POST_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
