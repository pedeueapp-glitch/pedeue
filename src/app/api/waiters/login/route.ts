import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sign } from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { slug, name, password } = await req.json();

    const store = await prisma.store.findUnique({
      where: { slug },
      include: { waiter: true }
    });

    if (!store) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    const waiter = store.waiter.find(w => w.name.toLowerCase() === name.toLowerCase() && w.isActive);

    if (!waiter || waiter.password !== password) {
      return NextResponse.json({ error: "Credenciais inválidas ou garçom inativo" }, { status: 401 });
    }

    // Gerar token (usando JWT_SECRET do ambiente)
    const token = sign(
      { 
        id: waiter.id, 
        name: waiter.name, 
        storeId: store.id,
        role: "WAITER"
      }, 
      process.env.NEXTAUTH_SECRET || "fallback-secret", 
      { expiresIn: "7d" }
    );

    return NextResponse.json({ 
      success: true, 
      token, 
      waiter: { id: waiter.id, name: waiter.name },
      store: { id: store.id, name: store.name }
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
