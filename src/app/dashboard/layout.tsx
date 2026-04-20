"use client";

import { useState, createContext, useContext, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

// Criar um contexto para que qualquer Header dentro das páginas possa abrir a sidebar
const SidebarContext = createContext({
  isOpen: false,
  toggle: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
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
        
        if (data?.subscription) {
          const expired = new Date(data.subscription.expiresAt) < new Date();
          setSubStatus({ 
            loading: false, 
            isExpired: expired, 
            expiresAt: data.subscription.expiresAt 
          });
        } else {
          // Sem assinatura = bloqueado
          setSubStatus({ loading: false, isExpired: true });
        }
      } catch {
        setSubStatus({ loading: false, isExpired: false });
      }
    }

    if (status === "authenticated") {
      checkSubscription();
    }
  }, [status, router]);

  const toggle = () => setIsSidebarOpen(!isSidebarOpen);

  // 2. Loading State
  if (status === "loading" || (status === "authenticated" && subStatus.loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Validando Acesso...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // 3. TELA DE BLOQUEIO POR ASSINATURA (Exceção para a página de plano)
  const isPlanPage = typeof window !== 'undefined' && window.location.pathname.includes('/dashboard/plano');
  
  if (subStatus.isExpired && !isPlanPage) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -ml-48 -mb-48" />

        <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[40px] text-center relative z-10 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/20 border border-red-500/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h11l4 4V12z" />
            </svg>
          </div>

          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">ACESSO BLOQUEADO</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-10 leading-relaxed">
            Sua assinatura {subStatus.expiresAt ? `venceu em ${new Date(subStatus.expiresAt).toLocaleDateString()}` : 'não foi encontrada'}.<br/> Renove agora para continuar vendendo.
          </p>

          <div className="space-y-4">
             <button 
               onClick={() => router.push("/dashboard/plano")}
               className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-orange-500/20"
             >
               Renovar Assinatura
             </button>
             
             <button 
               onClick={() => window.open('https://wa.me/SEU_NUMERO', '_blank')}
               className="w-full bg-white/5 hover:bg-white/10 text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] transition-all border border-white/10"
             >
               Falar com Suporte
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarContext.Provider value={{ isOpen: isSidebarOpen, toggle }}>
      <div className="flex min-h-screen bg-slate-50/50">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        <main className="flex-1 flex flex-col min-w-0">
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
