export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!storeId) {
    return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
  }

  // Define um cookie de impersonação que dura 2 horas
  const cookieStore = await cookies();
  cookieStore.set("impersonate_store_id", storeId, {
    maxAge: 60 * 60 * 2, // 2 horas
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  });

  // Redireciona para o dashboard
  // Usamos os headers para garantir o domínio correto em produção (evitando redirecionamento para localhost)
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "pedeue.com";
  const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return NextResponse.redirect(`${origin}/dashboard`);
}

