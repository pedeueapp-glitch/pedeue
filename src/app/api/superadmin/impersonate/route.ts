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
  // O Dashboard precisará ler este cookie caso o usuário seja SUPERADMIN
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
