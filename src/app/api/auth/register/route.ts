import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, storeName, whatsapp } = await req.json();

    if (!name || !email || !password || !storeName || !whatsapp) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter ao menos 8 caracteres" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 409 }
      );
    }

    // Gera slug único para a loja
    let baseSlug = generateSlug(storeName);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.store.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        store: {
          create: {
            name: storeName,
            slug,
            whatsapp: whatsapp.replace(/\D/g, ""),
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Conta criada com sucesso!",
        storeSlug: slug,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
