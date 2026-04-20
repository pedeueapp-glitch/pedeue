"use client";

import { User, Menu, Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSidebar } from "@/app/dashboard/layout";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const { toggle } = useSidebar();

  return (
    <header className="h-20 lg:h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4 lg:gap-8 flex-1">
        <button 
          onClick={toggle}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-all border border-slate-100"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-sm font-bold text-slate-800 tracking-tight lg:text-base">
            {title}
          </h1>
          <p className="text-[10px] hidden lg:block text-slate-400 font-medium">Controle total da sua operação.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="hidden sm:flex p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all relative">
          <Bell size={18} />
          <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
        </button>

        <div className="h-8 w-[1px] bg-slate-100 hidden sm:block mx-2" />

        <div className="flex items-center gap-3 text-left">
          <div className="hidden sm:block">
            <p className="text-[11px] font-bold text-slate-900 leading-none truncate max-w-[120px]">
              {session?.user?.name || "Usuário"}
            </p>
            <p className="text-[9px] font-semibold text-orange-500 mt-1 uppercase tracking-wider">
              {(session?.user as any)?.role === "SUPERADMIN" ? "SuperAdmin" : "Lojista"}
            </p>
          </div>
          <div className="w-10 h-10 lg:w-11 lg:h-11 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
