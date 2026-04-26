"use client";

import { useState, createContext, useContext, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import toast from "react-hot-toast";

// Criar um contexto para que qualquer Header dentro das páginas possa abrir a sidebar
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";
import { SystemAnnouncements } from "@/components/SystemAnnouncements";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [subStatus, setSubStatus] = useState<{ loading: boolean, isExpired: boolean, expiresAt?: string }>({ 
    loading: true, 
    isExpired: false 
  });

  // 1. Verificação de Autenticação e Assinatura
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/entrar");
      return;
    }

    async function checkSubscription() {
      try {
        const res = await fetch("/api/store");
        const data = await res.json();
        
        if (data?.isActive === false) {
           toast.error("Este estabelecimento está temporariamente bloqueado pelo administrador.");
           router.push("/contato-suporte"); // Ou outra página informativa
           return;
        }

        if (data?.subscription) {
          const expired = new Date(data.subscription.expiresAt) < new Date();
          setSubStatus({ 
            loading: false, 
            isExpired: expired, 
            expiresAt: data.subscription.expiresAt 
          });
        } else {
          setSubStatus({ loading: false, isExpired: true });
        }
      } catch (e: any) {
        setSubStatus({ loading: false, isExpired: false });
      }

    }

    if (status === "authenticated") {
      if (session.user.role === "AFFILIATE") {
        setSubStatus({ loading: false, isExpired: false });
        return;
      }
      checkSubscription();
    }
  }, [status, router, session]);

  // Loading State
  if (status === "loading" || (status === "authenticated" && subStatus.loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-[10px] font-black  text-slate-400 tracking-widest">Validando Acesso...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const isPDV = pathname?.includes("/pdv") || pathname?.includes("/mesas");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-slate-50/50">
        <SidebarWrapper mode={session.user.role === "AFFILIATE" ? "AFFILIATE" : "MERCHANT"} />
        
        <main className={`flex-1 flex flex-col min-w-0 ${isPDV ? "" : "pb-20 lg:pb-0"}`}>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

function SidebarWrapper({ mode }: { mode: "MERCHANT" | "AFFILIATE" }) {
  const { isOpen, close } = useSidebar();
  return (
    <Sidebar 
      isOpen={isOpen} 
      onClose={close} 
      mode={mode}
    />
  );
}
