"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";
import { Header } from "@/components/Header";

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/entrar");
      return;
    }

    if (status === "authenticated" && session.user.role !== "AFFILIATE") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-[10px] font-black text-slate-400 tracking-widest">Validando Acesso de Afiliado...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "AFFILIATE") return null;

  return (
    <SidebarProvider>
      <AffiliateContent>
        {children}
      </AffiliateContent>
    </SidebarProvider>
  );
}

function AffiliateContent({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useSidebar();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        isOpen={isOpen} 
        onClose={close}
        mode="AFFILIATE"
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header title="Painel do Parceiro" />
        <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
