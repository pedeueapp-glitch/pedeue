export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    include: {
      store: {
        select: {
          name: true,
          slug: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        id: Math.random().toString(36).substring(7),
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || "USER",
        updatedAt: new Date()
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Usuário com este e-mail já existe ou erro nos dados" }, { status: 400 });
  }
}

