export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { getCurrentStore } from "@/lib/get-store";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const store = await getCurrentStore();
    if (!store) {
      // Retornamos 200 null para evitar erro 404 no console
      // O frontend trata a ausência da loja conforme necessário
      return NextResponse.json(null);
    }

    return NextResponse.json(store);
  } catch (error: any) {
    console.error("[STORE_GET_ERROR]", error);
    return NextResponse.json({ error: "Erro ao buscar loja" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

    const body = await req.json();
    
    // Função simples de sanitização de texto (remove tags HTML)
    const sanitize = (str: string) => typeof str === 'string' ? str.replace(/<[^>]*>?/gm, '') : str;
    // Função para sanitizar IDs (apenas alfanuméricos e hífens)
    const sanitizeId = (str: string) => typeof str === 'string' ? str.replace(/[^a-zA-Z0-9-]/g, '') : str;

    const { 
      name, 
      slug, 
      description, 
      whatsapp, 
      deliveryTime, 
      logo, 
      coverImage, 
      primaryColor,
      openingHours,
      isOpen,
      storeType,
      showcaseBanners,
      restaurantBanners,
      serviceBanners,
      facebookPixelId,
      googleAnalyticsId,
      googleTagManagerId,
      tiktokPixelId,
      cpf,
      customDomain,
      pixKey,
      pixEnabled,
      pixMerchantName,
      pixMerchantCity,
      freeDeliveryThreshold
    } = body;

    // 1. Validar Slug (se mudou)
    if (slug) {
      const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      const existingStore = await prisma.store.findFirst({
        where: { 
          slug: cleanSlug,
          NOT: { userId: session.user.id }
        }
      });
      if (existingStore) {
        return NextResponse.json({ error: "Este link (slug) já existe. Escolha outro." }, { status: 400 });
      }
    }

    // 2. Montar objeto de atualização com sanitização
    const dataToUpdate: any = {
      name: name ? sanitize(name) : undefined,
      description: description !== undefined ? sanitize(description) : undefined,
      whatsapp: whatsapp !== undefined ? sanitize(whatsapp) : undefined,
      deliveryTime: deliveryTime ? String(deliveryTime) : undefined,
      logo: logo !== undefined ? logo : undefined,
      coverImage: coverImage !== undefined ? coverImage : undefined,
      primaryColor: (primaryColor && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(primaryColor)) ? primaryColor : undefined,
      isOpen: isOpen !== undefined ? Boolean(isOpen) : undefined,
      storeType: storeType || undefined,
      showcaseBanners: showcaseBanners !== undefined ? (typeof showcaseBanners === 'string' ? showcaseBanners : JSON.stringify(showcaseBanners)) : undefined,
      restaurantBanners: restaurantBanners !== undefined ? (typeof restaurantBanners === 'string' ? restaurantBanners : JSON.stringify(restaurantBanners)) : undefined,
      serviceBanners: serviceBanners !== undefined ? (typeof serviceBanners === 'string' ? serviceBanners : JSON.stringify(serviceBanners)) : undefined,
      openingHours: openingHours !== undefined ? (typeof openingHours === 'string' ? openingHours : JSON.stringify(openingHours)) : undefined,
      facebookPixelId: facebookPixelId !== undefined ? sanitizeId(facebookPixelId) : undefined,
      googleAnalyticsId: googleAnalyticsId !== undefined ? sanitizeId(googleAnalyticsId) : undefined,
      googleTagManagerId: googleTagManagerId !== undefined ? sanitizeId(googleTagManagerId) : undefined,
      tiktokPixelId: tiktokPixelId !== undefined ? sanitizeId(tiktokPixelId) : undefined,
      cpf: cpf !== undefined ? sanitizeId(cpf) : undefined,
      customDomain: (customDomain && typeof customDomain === 'string') ? sanitizeId(customDomain.trim().toLowerCase().replace(/\./g, '-')).replace(/-/g, '.') : undefined,
      pixKey: pixKey !== undefined ? sanitize(pixKey) : undefined,
      pixEnabled: pixEnabled !== undefined ? Boolean(pixEnabled) : undefined,
      pixMerchantName: pixMerchantName !== undefined ? sanitize(pixMerchantName) : undefined,
      pixMerchantCity: pixMerchantCity !== undefined ? sanitize(pixMerchantCity) : undefined,
      freeDeliveryThreshold: freeDeliveryThreshold !== undefined ? parseFloat(String(freeDeliveryThreshold).replace(',', '.')) : undefined,
    };

    if (slug) {
        dataToUpdate.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    }

    // 3. Update - Usando uma abordagem mais resiliente
    let updatedStore;
    try {
      updatedStore = await prisma.store.update({
        where: { userId: session.user.id },
        data: dataToUpdate
      });
    } catch (prismaError: any) {
      console.warn("Retrying update without new fields due to type mismatch/pending migration:", prismaError.message);
      
      // Fallback: remove campos novos se o Prisma Client estiver desatualizado
      const { 
        showcaseBanners: _, 
        facebookPixelId: __, 
        googleAnalyticsId: ___, 
        googleTagManagerId: ____, 
        tiktokPixelId: _____, 
        ...fallbackData 
      } = dataToUpdate;

      updatedStore = await prisma.store.update({
        where: { userId: session.user.id },
        data: fallbackData as any
      });
    }

    return NextResponse.json(updatedStore);
  } catch (error: any) {
    console.error("DETAILED PRISMA ERROR:", error);
    return NextResponse.json({ 
      error: "Falha técnica ao salvar no banco.",
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

