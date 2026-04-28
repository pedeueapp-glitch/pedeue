"use client";

import { User, Menu, Shield, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import Link from "next/link";
import { NotificationCenter } from "./NotificationCenter";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const { toggle } = useSidebar();
  const isSuperAdmin = (session?.user as any)?.role === "SUPERADMIN";

  return (
    <header className="h-20 lg:h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4 lg:gap-8 flex-1">
        <div className="lg:hidden w-8 h-8 flex items-center justify-center text-brand">
          <Menu size={20} className="opacity-0" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-800 tracking-tight lg:text-base">
            {title}
          </h1>
          <p className="text-[10px] hidden lg:block text-slate-400 font-medium">Controle total da sua operação. <span className="text-[9px] opacity-30">v1.1.1</span></p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isSuperAdmin && (
          <Link href="/superadmin" className="hidden sm:flex p-2.5 text-purple-600 hover:bg-purple-50 rounded-xl transition-all border border-purple-100 shadow-sm gap-2 items-center">
            <Shield size={18} />
            <span className="text-[10px] font-black  tracking-widest">Painel Admin</span>
          </Link>
        )}

        <NotificationCenter />

        <div className="h-8 w-[1px] bg-slate-100 hidden sm:block mx-2" />

        <div className="flex items-center gap-3 text-left">
          <div className="hidden sm:block">
            <p className="text-[11px] font-bold text-slate-900 leading-none truncate max-w-[120px]">
              {session?.user?.name || "Usuário"}
            </p>
            <p className="text-[9px] font-semibold text-purple-500 mt-1  tracking-wider">
              {isSuperAdmin ? "SuperAdmin" : "Lojista"}
            </p>
          </div>
          <Link 
            href="/dashboard/settings" 
            className="w-10 h-10 lg:w-11 lg:h-11 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all shadow-sm"
            title="Configurações"
          >
            <Settings size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
