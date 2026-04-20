import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await prisma.store.findUnique({
      where: { userId: session.user.id },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    return NextResponse.json(store);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar loja" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

    const body = await req.json();
    
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
      storeType
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

    // 2. Montar objeto de atualização
    const dataToUpdate: any = {
      name: name || undefined,
      description: description !== undefined ? description : undefined,
      whatsapp: whatsapp !== undefined ? whatsapp : undefined,
      deliveryTime: deliveryTime ? String(deliveryTime) : undefined,
      logo: logo !== undefined ? logo : undefined,
      coverImage: coverImage !== undefined ? coverImage : undefined,
      primaryColor: primaryColor || undefined,
      isOpen: isOpen !== undefined ? Boolean(isOpen) : undefined,
      storeType: storeType || undefined,
    };

    if (slug) {
        dataToUpdate.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    }

    // Corrigindo o erro de tipo para openingHours
    if (openingHours !== undefined) {
       // Se for objeto, vira string JSON. Se for string, mantém.
       dataToUpdate.openingHours = typeof openingHours === 'string' 
        ? openingHours 
        : JSON.stringify(openingHours);
    }

    // 3. Update
    const updatedStore = await prisma.store.update({
      where: { userId: session.user.id },
      data: dataToUpdate
    });

    return NextResponse.json(updatedStore);
  } catch (error: any) {
    console.error("DETAILED PRISMA ERROR:", error);
    return NextResponse.json({ 
      error: "Falha técnica ao salvar no banco.",
      details: error.message 
    }, { status: 500 });
  }
}
