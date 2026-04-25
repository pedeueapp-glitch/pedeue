"use client";

import { 
  Store, 
  CreditCard, 
  LayoutDashboard, 
  Globe, 
  LogOut, 
  ShieldCheck, 
  X, 
  Menu, 
  ChevronRight,
  Users
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function SuperAdminNavigation({ activeTab, setActiveTab }: NavigationProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "stores", label: "Lojistas", icon: Store },
    { id: "plans", label: "Planos SaaS", icon: CreditCard },
    { id: "cities", label: "Cidades", icon: Globe },
    { id: "users", label: "Gerir Usuários", icon: Users },
  ];

  return (
    <>
      {/* MOBILE HEADER */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#0f172a] h-16 flex items-center justify-between px-6 z-[60]">
          <div className="flex items-center gap-2">
             <ShieldCheck className="text-purple-500" size={24} />
             <h1 className="text-white font-black text-xl tracking-tighter ">SUPER<span className="text-purple-500">ADMIN</span></h1>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white border-none bg-transparent">
             {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
      </header>

      {/* SIDEBAR */}
      <aside className={`
        w-72 h-screen bg-[#0f172a] flex flex-col fixed top-0 left-0 z-50 transition-all duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        rounded-none border-none shadow-[4px_0_24px_rgba(0,0,0,0.1)]
      `}>
        <div className="p-8 hidden lg:block">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-purple-500" size={32} />
              <h1 className="text-2xl font-black text-white tracking-tighter ">
                SUPER<span className="text-purple-500">ADMIN</span>
              </h1>
            </div>
        </div>

        <nav className="flex-1 px-4 mt-20 lg:mt-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`
                w-full flex items-center justify-between px-6 py-4 rounded-none text-xs font-bold transition-all  tracking-tight
                ${activeTab === item.id 
                  ? "bg-white/10 text-white border-r-4 border-purple-500" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"}
              `}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
              {activeTab === item.id && <ChevronRight size={14} className="opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={() => signOut({ callbackUrl: "/entrar" })}
            className="w-full flex items-center gap-3 px-6 py-4 text-red-500 hover:bg-red-500/10 rounded-none transition-all font-bold text-xs "
          >
            <LogOut size={20} />
            Sair do Painel
          </button>
        </div>
      </aside>
    </>
  );
}
