import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import efi from "@/lib/efi";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    database: "checking",
    efi: "checking",
    whatsapp: "checking",
    vps: "checking",
    timestamp: new Date().toISOString()
  };

  // 1. Check Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.database = "online";
  } catch (e) {
    results.database = "offline";
  }

  // 2. Check Efí
  try {
    await efi.pixListEvp({}, {});
    results.efi = "online";
  } catch (e) {
    results.efi = "offline";
  }

  // 3. Check WhatsApp (Evolution API)
  if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) {
    try {
      const res = await fetch(`${process.env.EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: { "apikey": process.env.EVOLUTION_API_KEY }
      });
      results.whatsapp = res.ok ? "online" : "offline";
    } catch (e) {
      results.whatsapp = "offline";
    }
  } else {
    results.whatsapp = "not_configured";
  }

  return NextResponse.json(results);
}
