import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id: originalId } = await params;

    // 1. Buscar o produto original com todos os relacionamentos e info do plano
    const originalProduct = await prisma.product.findUnique({
      where: { id: originalId },
      include: {
        optiongroup: {
          include: {
            option: true
          }
        },
        variants: true,
        store: {
          include: {
            subscription: {
              include: {
                plan: true
              }
            }
          }
        }
      }
    });

    if (!originalProduct) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // 2. Verificar Permissão do Plano
    const planFeatures = originalProduct.store?.subscription?.plan?.features;
    const { hasFeature } = await import("@/lib/permissions");
    
    if (!hasFeature(planFeatures, 'PRODUCT_DUPLICATION')) {
      return NextResponse.json({ 
        error: "Seu plano atual não permite a duplicação de produtos. Faça um upgrade para liberar!",
        code: "PLAN_RESTRICTION"
      }, { status: 403 });
    }

    // 2. Criar a cópia em uma transação
    const duplicatedProduct = await prisma.$transaction(async (tx) => {
      const newProductId = uuidv4();

      // Criar o produto base
      const product = await tx.product.create({
        data: {
          id: newProductId,
          name: `${originalProduct.name} (Cópia)`,
          description: originalProduct.description,
          price: originalProduct.price,
          salePrice: originalProduct.salePrice,
          imageUrl: originalProduct.imageUrl,
          isActive: false, // Inicia desativado por segurança
          inStock: originalProduct.inStock,
          barcode: originalProduct.barcode ? `${originalProduct.barcode}-copy` : null,
          purchasePrice: originalProduct.purchasePrice,
          profitMargin: originalProduct.profitMargin,
          isCombo: originalProduct.isCombo,
          comboConfig: originalProduct.comboConfig,
          productType: originalProduct.productType,
          categoryId: originalProduct.categoryId,
          storeId: originalProduct.storeId,
          position: originalProduct.position + 1,
          updatedAt: new Date(),
        }
      });

      // Clonar Grupos de Opções e suas Opções
      for (const group of originalProduct.optiongroup) {
        await tx.optiongroup.create({
          data: {
            name: group.name,
            minOptions: group.minOptions,
            maxOptions: group.maxOptions,
            isRequired: group.isRequired,
            priceCalculation: group.priceCalculation,
            productId: newProductId,
            updatedAt: new Date(),
            option: {
              create: group.option.map(opt => ({
                name: opt.name,
                price: opt.price,
                isActive: opt.isActive,
                updatedAt: new Date(),
              }))
            }
          }
        });
      }

      // Clonar Variantes
      if (originalProduct.variants.length > 0) {
        await tx.product_variant.createMany({
          data: originalProduct.variants.map(variant => ({
            productId: newProductId,
            color: variant.color,
            colorHex: variant.colorHex,
            sizes: variant.sizes,
            imageUrl: variant.imageUrl,
            stock: variant.stock,
            barcode: variant.barcode ? `${variant.barcode}-copy` : null,
            updatedAt: new Date(),
          }))
        });
      }

      return product;
    });

    return NextResponse.json(duplicatedProduct);
  } catch (error) {
    console.error("Erro ao duplicar produto:", error);
    return NextResponse.json({ error: "Erro interno ao duplicar" }, { status: 500 });
  }
}
