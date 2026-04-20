import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!store) {
    return {
      title: "Loja nao encontrada",
    };
  }

  return {
    title: `${store.name} - Cardapio Digital`,
    description:
      store.description ??
      `Faca seu pedido direto no WhatsApp pela ${store.name}`,
  };
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
