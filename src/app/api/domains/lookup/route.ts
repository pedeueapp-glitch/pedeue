import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "Domínio não informado" }, { status: 400 });
  }

  try {
    // Busca a loja que tem esse domínio customizado
    const store = await prisma.store.findUnique({
      where: { customDomain: domain },
      select: { slug: true }
    });

    if (!store) {
      return NextResponse.json({ error: "Loja não encontrada para este domínio" }, { status: 404 });
    }

    return NextResponse.json({ slug: store.slug });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
