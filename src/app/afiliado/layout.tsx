"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  DollarSign,
  LogOut,
  Menu,
  X,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navLinks = [
  { href: "/afiliado", label: "Dashboard", icon: LayoutDashboard },
  { href: "/afiliado/prospectar", label: "Prospectar Loja", icon: UserPlus },
  { href: "/afiliado/clientes", label: "Meus Clientes", icon: Users },
  { href: "/afiliado/financeiro", label: "Financeiro", icon: DollarSign },
];

export default function AffiliateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/entrar");
    } else if (status === "authenticated" && (session?.user as any)?.role !== "AFFILIATE") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm tracking-widest uppercase text-xs">Validando acesso...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const currentLabel = navLinks.find((n) => n.href === pathname)?.label ?? "Painel";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#0f0f1a] border-r border-white/5">
        <SidebarContent pathname={pathname} session={session} />
      </aside>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#0f0f1a] border-r border-white/5 transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent pathname={pathname} session={session} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-white/5 bg-[#0f0f1a]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold text-sm">{currentLabel}</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  session,
  onClose,
}: {
  pathname: string;
  session: any;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full p-4">
      {/* Logo */}
      <div className="flex items-center justify-between mb-8 px-2 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">PedeUe</p>
            <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-widest">Afiliados</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <link.icon className="w-4 h-4 flex-shrink-0" />
              {link.label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/5 pt-4 mt-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{session?.user?.name}</p>
            <p className="text-gray-500 text-[10px] truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/entrar" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </div>
  );
}
