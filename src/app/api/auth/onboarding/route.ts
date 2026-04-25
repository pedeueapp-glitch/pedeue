export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
    const body = await req.json();
    const { 
      name, email, password, 
      storeName, slug, storeType, 
      planId, whatsapp, cpf
    } = body;

    // 1. Validações básicas
    if (!name || !email || !password || !storeName || !slug || !storeType || !planId || !whatsapp || !cpf) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
    }

    const cleanCPF = cpf.replace(/\D/g, "");
    if (!validateCPF(cleanCPF)) {
      return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 400 });

    const slugExists = await prisma.store.findUnique({ where: { slug } });
    if (slugExists) return NextResponse.json({ error: "Este link (slug) já está em uso." }, { status: 400 });

    const cpfExists = await prisma.store.findFirst({ where: { cpf: cleanCPF } });
    if (cpfExists) return NextResponse.json({ error: "Este CPF já possui uma loja cadastrada." }, { status: 400 });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });

    // 2. Criar Usuário
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();
    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        password: hashedPassword,
        role: "USER",
        updatedAt: new Date()
      }
    });

    // 3. Criar Loja
    const store = await prisma.store.create({
      data: {
        name: storeName,
        slug,
        storeType, 
        whatsapp: whatsapp.replace(/\D/g, ""), 
        cpf: cleanCPF,
        userId: user.id,
        updatedAt: new Date()
      }
    });

    const trialDate = new Date();
    trialDate.setDate(trialDate.getDate() + 3);

    // 4. Criar Categoria Padrão "Geral"
    await prisma.category.create({
      data: {
        name: "Geral",
        emoji: "📦",
        position: 0,
        storeId: store.id,
        updatedAt: new Date()
      }
    });

    // 5. Criar Assinatura (3 dias grátis)
    await prisma.subscription.create({
      data: {
        storeId: store.id,
        planId: plan.id,
        status: "ACTIVE", 
        expiresAt: trialDate,
      }
    });

    // 6. Enviar E-mail de Boas Vindas
    import("@/lib/email").then(({ sendWelcomeEmail }) => {
      sendWelcomeEmail(user.email, user.name || "Lojista").catch(console.error);
    });

    return NextResponse.json({ 
      success: true,
      userId: user.id,
      storeId: store.id
    });

  } catch (error: any) {
    console.error("ONBOARDING ERROR:", error);
    return NextResponse.json({ error: error.message || "Erro ao processar cadastro" }, { status: 500 });
  }
}
