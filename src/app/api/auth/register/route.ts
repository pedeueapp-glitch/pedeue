export const dynamic = 'force-dynamic';
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

function validateCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  const cpfs = cpf.split('').map(el => +el);
  
  let sum1 = 0;
  for (let i = 0; i < 9; i++) sum1 += cpfs[i] * (10 - i);
  let r1 = (sum1 * 10) % 11;
  if (r1 === 10 || r1 === 11) r1 = 0;
  if (r1 !== cpfs[9]) return false;

  let sum2 = 0;
  for (let i = 0; i < 10; i++) sum2 += cpfs[i] * (11 - i);
  let r2 = (sum2 * 10) % 11;
  if (r2 === 10 || r2 === 11) r2 = 0;
  if (r2 !== cpfs[10]) return false;

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, storeName, whatsapp, cpf } = await req.json();

    if (!name || !email || !password || !storeName || !whatsapp || !cpf) {
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

    const cleanCPF = cpf.replace(/\D/g, "");
    if (!validateCPF(cleanCPF)) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 409 }
      );
    }

    // Verifica CPF no banco
    const existingCPF = await prisma.store.findFirst({ where: { cpf: cleanCPF } });
    if (existingCPF) {
      return NextResponse.json(
        { error: "Este CPF já está cadastrado em outra loja" },
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
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
        updatedAt: new Date(),
        store: {
          create: {
            id: crypto.randomUUID(),
            name: storeName,
            slug,
            whatsapp: whatsapp.replace(/\D/g, ""),
            cpf: cleanCPF,
            updatedAt: new Date(),
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
