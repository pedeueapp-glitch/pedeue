"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
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
  ClipboardList,
  Lock,
  ExternalLink,
  Copy,
  ScrollText,
  Calendar,
  Box,
  LifeBuoy,
  RotateCcw,
  AlertTriangle,
  Image as ImageIcon,
  Activity,
  Server,
  ShieldCheck,
  Eye,
  Download
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { hasFeature } from "@/lib/permissions";
import toast from "react-hot-toast";

interface SidebarProps {
  mode?: "MERCHANT" | "SUPERADMIN";
  isOpen?: boolean;
  onClose?: () => void;
}

function SidebarContent({ mode = "MERCHANT", isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
  const isExpired = mode === "MERCHANT" && store?.subscription?.expiresAt && new Date(store.subscription.expiresAt) < new Date();

  const allMerchantLinks = [
    { name: "PDV Pedidos", href: "/dashboard/pdv", icon: ShoppingBag, feature: 'PDV_SYSTEM' },
    { name: "Relatório de Pedidos", href: "/dashboard/pedidos", icon: ClipboardList },
    { name: "Meus Produtos", href: "/dashboard/products", icon: UtensilsCrossed },
    { name: "Categorias", href: "/dashboard/categories", icon: Layers },
    { name: "Motoboys", href: "/dashboard/drivers", icon: Users },
    { name: "Garçons", href: "/dashboard/waiters", icon: Users, feature: 'TABLE_MANAGEMENT' },
    { name: "Mesas", href: "/dashboard/tables", icon: Layers, feature: 'TABLE_MANAGEMENT' },
    { name: "Taxas de Entrega", href: "/dashboard/delivery-fees", icon: MapPin },
    { name: "Cupons e Cashback", href: "/dashboard/coupons", icon: Tag, feature: 'COUPON_SYSTEM' },
    { name: "Marketing e Crescimento", href: "/dashboard/marketing", icon: TrendingUp },
    { name: "Financeiro", href: "/dashboard", icon: LayoutDashboard },

    { name: "Suporte", href: "/dashboard/support", icon: LifeBuoy },
    { name: "Minha Assinatura", href: "/dashboard/subscription", icon: CreditCard },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings },
    { name: "Vendas Vitrine", href: "/dashboard/vendas-vitrine", icon: ClipboardList, showcaseOnly: true },
    { name: "Clientes", href: "/dashboard/customers", icon: Users, serviceOnly: true },
    { name: "Orçamentos", href: "/dashboard/quotes", icon: ScrollText, serviceOnly: true },
    { name: "Calendário", href: "/dashboard/calendar", icon: Calendar, serviceOnly: true },
  ];

  const merchantLinks = allMerchantLinks.filter((link: any) => {
    if (store?.storeType === "SHOWCASE") {
      const hiddenInShowcase = ["Mesas", "Garçons", "Motoboys", "Taxas de Entrega", "Orçamentos", "Calendário", "Clientes", "Cupons e Cashback"];
      if (hiddenInShowcase.includes(link.name)) return false;
      if (link.name === "PDV Pedidos") link.name = "PDV Loja";
    } else if (store?.storeType === "SERVICE") {
      const serviceOrder = ["Orçamentos", "Novo Orçamento", "Calendário", "Categorias", "Produtos", "Clientes", "Minha Assinatura", "Configurações", "Suporte"];
      if (link.name === "Meus Produtos") link.name = "Produtos";
      if (link.name === "PDV Pedidos") link.name = "Novo Orçamento";
      if (!serviceOrder.includes(link.name)) return false;
    } else {
      if (link.showcaseOnly || link.serviceOnly) return false;
    }
    return true;
  });

  // Adicionar "Ver Cardápio" mobile
  if (store?.slug && !merchantLinks.some(l => l.name === "Ver Cardápio")) {
    merchantLinks.push({ 
      name: "Ver Cardápio", 
      href: `/${store.slug}`, 
      icon: Eye,
      mobileOnly: true 
    });
  }

  // Definição dos Grupos (Apenas para Merchant Desktop)
  const groupedLinks = [
    { name: "PDV Pedidos", href: "/dashboard/pdv", icon: ShoppingBag, feature: 'PDV_SYSTEM' },
    {
      name: "Gerenciar Loja",
      icon: Settings,
      items: [
        { name: "Meus Produtos", href: "/dashboard/products", icon: UtensilsCrossed },
        { name: "Categorias", href: "/dashboard/categories", icon: Layers },
        { name: "Motoboys", href: "/dashboard/drivers", icon: Users },
        { name: "Garçons", href: "/dashboard/waiters", icon: Users, feature: 'TABLE_MANAGEMENT' },
        { name: "Mesas", href: "/dashboard/tables", icon: Layers, feature: 'TABLE_MANAGEMENT' },
        { name: "Taxas de Entrega", href: "/dashboard/delivery-fees", icon: MapPin },
        { name: "Cupons e Cashback", href: "/dashboard/coupons", icon: Tag, feature: 'COUPON_SYSTEM' },
      ]
    },
    {
      name: "Gestão Financeira",
      icon: CreditCard,
      items: [
        { name: "Relatório de Pedidos", href: "/dashboard/pedidos", icon: ClipboardList },
        { name: "Financeiro", href: "/dashboard", icon: LayoutDashboard },
        { name: "Minha Assinatura", href: "/dashboard/subscription", icon: CreditCard },
      ]
    },
    { name: "Marketing e Crescimento", href: "/dashboard/marketing", icon: TrendingUp },
    { name: "Suporte", href: "/dashboard/support", icon: LifeBuoy },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings },
  ];

  const superAdminLinks = [
    { name: "Painel Geral", href: "/superadmin", icon: LayoutDashboard },
    { name: "Analytics Pro", href: "/superadmin?tab=analytics", icon: TrendingUp },
    { name: "Gestão de Lojas", href: "/superadmin?tab=stores", icon: ShoppingBag },
    { name: "Gestão Financeira", href: "/superadmin?tab=payments", icon: CreditCard },
    { name: "Planos Mensais", href: "/superadmin?tab=plans", icon: Layers },
    { name: "Relatório Expiração", href: "/superadmin?tab=expiration", icon: Calendar },
    { name: "Logs de Webhooks", href: "/superadmin?tab=webhooks", icon: ScrollText },
    { name: "Avisos Globais", href: "/superadmin?tab=broadcast", icon: AlertTriangle },
    { name: "Tickets de Suporte", href: "/superadmin?tab=support", icon: LifeBuoy },
    { name: "Gerir Usuários", href: "/superadmin?tab=users", icon: Users },
    { name: "Status do Sistema", href: "/superadmin?tab=health", icon: Activity },
    { name: "Monitoramento VPS", href: "/superadmin?tab=vps", icon: Server },
    { name: "Backups", href: "/superadmin?tab=backups", icon: ShieldCheck },
  ];

  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => prev.includes(name) ? prev.filter(g => g !== name) : [...prev, name]);
  };

  const navigationLinks = mode === "SUPERADMIN" ? superAdminLinks : merchantLinks;


  return (
    <>
      <aside className={`
        hidden lg:flex lg:sticky top-0 left-0 z-[70]
        w-72 h-screen bg-[#0f172a] flex-col
      `}>
        <div className="p-5 pb-4 flex flex-col gap-4">
          <button onClick={onClose} className="lg:hidden text-slate-400 p-2"><X size={20}/></button>

          {mode === "MERCHANT" && store && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
               {isExpired && (
                 <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 mb-2">
                    <AlertTriangle className="text-red-500" size={18} />
                    <span className="text-[10px] font-black text-red-400  tracking-tight">Assinatura Vencida</span>
                 </div>
               )}

                <div className="flex gap-2">
                  <button 
                   onClick={() => {
                     const protocol = window.location.protocol;
                     const host = window.location.host.replace('www.', '');
                     const url = host.includes('localhost') ? `/${store.slug}` : `${protocol}//${store.slug}.${host}`;
                     window.open(url, '_blank');
                   }}
                   disabled={isExpired}
                   className={`flex-1 py-2.5 text-white rounded-lg text-[10px] font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${isExpired ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/20'}`}
                  >
                     <ExternalLink size={14} /> {store.storeType === "SHOWCASE" ? "Vitrine" : "Site"}
                  </button>
                  
                  <button 
                   onClick={() => {
                     const protocol = window.location.protocol;
                     const host = window.location.host.replace('www.', '');
                     const url = host.includes('localhost') ? `${protocol}//${host}/${store.slug}` : `${protocol}//${store.slug}.${host}`;
                     navigator.clipboard.writeText(url);
                     toast.success("Link do Site Copiado!");
                   }}
                   className="w-10 py-2.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-all"
                   title="Copiar Link do Site"
                  >
                     <Copy size={14} />
                  </button>

                  {store.storeType === "RESTAURANT" && (
                    <button 
                      onClick={() => {
                        const protocol = window.location.protocol;
                        const host = window.location.host.replace('www.', '');
                        const url = host.includes('localhost') ? `${protocol}//${host}/${store.slug}/mesas` : `${protocol}//${store.slug}.${host}/mesas`;
                        navigator.clipboard.writeText(url);
                        toast.success("Link do Garçom Copiado!");
                      }}
                      className="w-10 py-2.5 bg-brand/10 border border-brand/20 text-brand hover:bg-brand hover:text-white rounded-lg flex items-center justify-center transition-all"
                      title="Link dos Garçons"
                    >
                      <UtensilsCrossed size={14} />
                    </button>
                  )}
                </div>

               <div className="flex flex-col gap-2 px-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-500 tracking-widest">Segmento</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-purple-400 tracking-widest bg-purple-500/10 px-2 py-0.5 rounded">
                        {store.storeType === "SHOWCASE" ? "Vitrine" : store.storeType === "SERVICE" ? "Serviços" : "Cardápio Digital"}
                      </span>
                      <button 
                        onClick={() => window.location.reload()}
                        className="p-1 text-slate-500 hover:text-white transition-colors"
                        title="Recarregar"
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto sidebar-scrollbar">
          {mode === "MERCHANT" ? groupedLinks.map((group: any) => {
            const isGroup = !!group.items;
            const Icon = group.icon;
            
            if (isGroup) {
              const isOpen = openGroups.includes(group.name);
              // Filter items based on availability
              const visibleItems = group.items.filter((item: any) => {
                return merchantLinks.some(ml => ml.name === item.name);
              });

              if (visibleItems.length === 0) return null;

              return (
                <div key={group.name} className="space-y-1 py-1">
                  <button 
                    onClick={() => toggleGroup(group.name)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                       <div className="p-2 rounded-lg bg-white/5">
                          <Icon size={16} />
                       </div>
                       <span>{group.name}</span>
                    </div>
                    <ChevronRight size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {isOpen && (
                    <div className="pl-4 space-y-1 animate-in slide-in-from-top-1 duration-200">
                      {visibleItems.map((item: any) => {
                        const ItemIcon = item.icon;
                        const isActive = pathname === item.href;
                        const isLocked = item.feature && !hasFeature(planFeatures, item.feature as any);

                        return (
                          <Link
                            key={item.href}
                            href={isLocked ? "#" : item.href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 ${isActive ? 'bg-brand text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            onClick={() => isLocked && toast.error("Recurso bloqueado no seu plano.")}
                          >
                            <ItemIcon size={14} />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Single link
            const isActive = pathname === group.href;
            const isLocked = (group.feature && !hasFeature(planFeatures, group.feature as any)) || (isExpired && group.name !== "Minha Assinatura");

            return (
              <Link
                key={group.href}
                href={isLocked ? "#" : group.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${isActive ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                onClick={() => isLocked && toast.error("Assinatura vencida ou recurso bloqueado.")}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                  <Icon size={16} />
                </div>
                <span>{group.name}</span>
              </Link>
            );
          }) : superAdminLinks.map((link: any) => {
             const Icon = link.icon;
             const isActive = pathname === link.href || (link.href.includes('?') && pathname === link.href.split('?')[0] && searchParams.get('tab') === new URLSearchParams(link.href.split('?')[1]).get('tab'));
             
             return (
               <Link
                 key={link.href}
                 href={link.href}
                 className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${isActive ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
               >
                 <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                   <Icon size={16} />
                 </div>
                 <span>{link.name}</span>
               </Link>
             );
          })}
        </nav>

        {mode === "MERCHANT" && (
          <div className="px-6 py-2">
              <a 
                href="/downloads/pedeue-setup.exe" 
                download 
                className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-purple-400 transition-all uppercase tracking-widest"
              >
                <Download size={12} />
                Baixar PDV Desktop
              </a>
          </div>
        )}

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={() => signOut({ callbackUrl: "/entrar" })}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all font-bold text-sm italic-none"
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      {true && (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0f172a] border-t border-slate-800 p-2 flex overflow-x-auto no-scrollbar lg:hidden gap-1 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)]">
           {navigationLinks.map((link: any) => {
            const Icon = link.icon;
            let isActive = false;
            if (link.href.includes('?')) {
               const [path, query] = link.href.split('?');
               const params = new URLSearchParams(query);
               const tab = params.get('tab');
               isActive = pathname === path && searchParams.get('tab') === tab;
            } else {
               if (mode === "SUPERADMIN" && link.href === "/superadmin") {
                  isActive = pathname === "/superadmin" && !searchParams.get('tab');
               } else {
                  isActive = pathname === link.href;
               }
            }

            const isLocked = (link.feature && !hasFeature(planFeatures, link.feature as any)) || 
                             (isExpired && link.name !== "Minha Assinatura");

            const Component = link.external ? 'a' : Link;
            const extraProps = link.external ? { target: "_blank", rel: "noopener noreferrer" } : {};

            return (
              <Component
                key={link.href}
                href={isLocked ? "#" : link.href}
                {...extraProps}
                onClick={(e: any) => {
                   if (isLocked) {
                      e.preventDefault();
                      toast.error("Assinatura vencida! Acesse 'Minha Assinatura' para renovar.");
                   }
                }}
                className={`
                  flex flex-col items-center justify-center min-w-[72px] h-14 rounded-lg gap-1 transition-all relative
                  ${isActive 
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" 
                    : isLocked ? "text-slate-600 cursor-not-allowed" : "text-slate-400 hover:text-white"}
                `}
              >
                <Icon size={20} className={isLocked ? "opacity-30" : ""} />
                <span className={`text-[9px] font-black tracking-tight text-center leading-none ${isLocked ? "opacity-40" : ""}`}>{link.name.replace("Gestão de ", "")}</span>
                {isLocked && <Lock size={10} className="absolute top-1 right-1 text-slate-600" />}
              </Component>
            );
         })}
      </nav>
      )}
    </>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<div className="w-72 bg-[#0f172a] h-screen" />}>
      <SidebarContent {...props} />
    </Suspense>
  );
}
