"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  ShoppingBag, 
  Users, 
  MapPin,
  UtensilsCrossed,
  Layers,
  X,
  ChevronRight,
  TrendingUp,
  Tag,
  CreditCard,
  ClipboardList
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { hasFeature } from "@/lib/permissions";
import { Lock } from "lucide-react";

interface SidebarProps {
  mode?: "MERCHANT" | "SUPERADMIN";
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mode = "MERCHANT", isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    if (mode === "MERCHANT") {
      fetch("/api/store")
        .then(res => res.json())
        .then(setStore)
        .catch(() => {});
    }
  }, [mode]);

  const planFeatures = store?.subscription?.plan?.features;

  const allMerchantLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "PDV Pedidos", href: "/dashboard/pdv", icon: ShoppingBag, feature: 'PDV_SYSTEM' },
    { name: "Vendas Vitrine", href: "/dashboard/vendas-vitrine", icon: ClipboardList, showcaseOnly: true },
    { name: "Mesas", href: "/dashboard/tables", icon: Layers, feature: 'TABLE_MANAGEMENT' },
    { name: "Garcons", href: "/dashboard/waiters", icon: Users, feature: 'TABLE_MANAGEMENT' },
    { name: "Motoboys", href: "/dashboard/drivers", icon: Users },
    { name: "Meus Produtos", href: "/dashboard/products", icon: UtensilsCrossed },
    { name: "Cupons & Cashback", href: "/dashboard/coupons", icon: Tag, feature: 'COUPON_SYSTEM' },
    { name: "Taxas de Entrega", href: "/dashboard/delivery-fees", icon: MapPin },
    { name: "Categorias", href: "/dashboard/categories", icon: Layers },
    { name: "Configuracoes", href: "/dashboard/settings", icon: Settings },
  ];

  const merchantLinks = allMerchantLinks.filter((link: any) => {
    if (store?.storeType === "SHOWCASE") {
      const hiddenInShowcase = ["Mesas", "Garcons", "Motoboys", "Taxas de Entrega"];
      if (hiddenInShowcase.includes(link.name)) return false;
      if (link.name === "PDV Pedidos") link.name = "PDV Loja";
    } else {
      // Esconde links exclusivos da vitrine quando no modo lanchonete
      if (link.showcaseOnly) return false;
    }
    return true;
  });

  const superAdminLinks = [
    { name: "Lojas", href: "/superadmin", icon: ShoppingBag },
    { name: "Planos Mensais", href: "/superadmin?tab=plans", icon: CreditCard },
    { name: "Usuários", href: "/superadmin/users", icon: Users },
    { name: "Cidades", href: "/superadmin/cities", icon: MapPin },
  ];

  const links = mode === "SUPERADMIN" ? superAdminLinks : merchantLinks;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      <aside className={`
        fixed lg:sticky top-0 left-0 z-[70]
        w-72 h-screen bg-[#0f172a] flex flex-col
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 pb-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
               <ShoppingBag className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-black text-white tracking-tight">
              App<span className="text-orange-500">Delivery</span>
            </h1>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 p-2"><X size={20}/></button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {links.map((link: any) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            const isLocked = link.feature && !hasFeature(planFeatures, link.feature as any);

            return (
              <Link
                key={link.href}
                href={isLocked ? "#" : link.href}
                onClick={(e) => {
                   if (isLocked) {
                      e.preventDefault();
                      return;
                   }
                   onClose?.();
                }}
                className={`
                  flex items-center justify-between px-6 py-4 rounded-xl text-xs font-bold transition-all group relative
                  ${isActive 
                    ? "bg-orange-500 text-white shadow-xl shadow-orange-500/20" 
                    : isLocked ? "text-slate-600 cursor-not-allowed" : "text-slate-400 hover:text-white hover:bg-white/5"}
                `}
              >
                <div className="flex items-center gap-4">
                  <Icon size={18} className={isLocked ? "opacity-30" : ""} />
                  <span className={isLocked ? "opacity-40" : ""}>{link.name}</span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
                {isLocked && <Lock size={12} className="text-slate-600" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={() => signOut({ callbackUrl: "/entrar" })}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm italic-none"
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>
      </aside>
    </>
  );
}
