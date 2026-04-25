import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentStore() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const cookieStore = await cookies();
  const impersonateId = cookieStore.get("impersonate_store_id")?.value;

  // Se for superadmin e houver um ID de impersonação, retorna aquela loja
  if ((session.user as any).role === "SUPERADMIN" && impersonateId) {
    return await prisma.store.findUnique({
      where: { id: impersonateId },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });
  }

  // Caso contrário, retorna a loja do próprio usuário
  return await prisma.store.findUnique({
    where: { userId: session.user.id },
    include: {
      subscription: {
        include: {
          plan: true
        }
      }
    }
  });
}
