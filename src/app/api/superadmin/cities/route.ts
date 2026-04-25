export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const cities = await prisma.platformcity.findMany({
    orderBy: { state: "asc" }
  });

  return NextResponse.json(cities);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const data = await req.json();
    
    // Check if already exists
    const existing = await prisma.platformcity.findFirst({
      where: { name: data.name, state: data.state }
    });

    if (existing) {
       return NextResponse.json({ error: "Esta cidade já foi adicionada." }, { status: 400 });
    }

    const city = await prisma.platformcity.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        state: data.state,
        isActive: data.isActive ?? true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(city, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

