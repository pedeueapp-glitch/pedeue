import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PDVComponent from "@/components/PDVComponent";
import RetailPDV from "@/components/RetailPDV";
import ServicePDV from "@/components/ServicePDV";
import { redirect } from "next/navigation";

export default async function PDVPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const store = await prisma.store.findUnique({
    where: { userId: session.user.id }
  });

  if (!store) return redirect("/login");

  if (store.storeType === "SHOWCASE") {
    return <RetailPDV storeId={store.id} />;
  }

  if (store.storeType === "SERVICE") {
    return <ServicePDV storeId={store.id} />;
  }

  return <PDVComponent fullscreen={true} />;
}
