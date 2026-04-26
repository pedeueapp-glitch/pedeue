import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { categories } = await req.json();
    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { store: true }
    });

    if (!user?.store) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    const storeId = user.store.id;

    // Transaction to save everything
    await prisma.$transaction(async (tx) => {
      for (const catData of categories) {
        // Create or find category
        const category = await tx.category.create({
          data: {
            name: catData.name,
            storeId: storeId,
            storeType: user.store!.storeType,
            updatedAt: new Date(),
          }
        });

        for (const prodData of catData.products) {
          // Create product
          const product = await tx.product.create({
            data: {
              id: uuidv4(),
              name: prodData.name,
              description: prodData.description,
              price: prodData.price || 0,
              categoryId: category.id,
              storeId: storeId,
              productType: user.store!.storeType,
              updatedAt: new Date(),
              optiongroup: prodData.optionGroups ? {
                create: prodData.optionGroups.map((group: any) => ({
                  name: group.name,
                  minOptions: parseInt(group.minOptions) || 0,
                  maxOptions: parseInt(group.maxOptions) || 1,
                  isRequired: group.isRequired || false,
                  updatedAt: new Date(),
                  option: {
                    create: group.options.map((opt: any) => ({
                      name: opt.name,
                      price: parseFloat(opt.price) || 0,
                      updatedAt: new Date(),
                    }))
                  }
                }))
              } : undefined
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao salvar importação:", error);
    return NextResponse.json({ error: "Falha ao salvar cardápio: " + error.message }, { status: 500 });
  }
}
