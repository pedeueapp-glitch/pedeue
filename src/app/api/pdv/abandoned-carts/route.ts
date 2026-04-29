import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const store = await prisma.store.findUnique({ where: { userId: (session.user as any).id } });
        if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

        const carts = await prisma.abandonedcart.findMany({
            where: { storeId: store.id },
            orderBy: { abandonedAt: 'desc' },
            take: 50
        });

        return NextResponse.json(carts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
