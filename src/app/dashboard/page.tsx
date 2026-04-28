"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import Link from "next/link";
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  ShoppingBag,
  Loader2,
  Users,
  BarChart3,
  Search,
  Package,
  AlertTriangle,
  Clock,
  Sparkles,
  ScrollText,
  Download,
  Box
} from "lucide-react";
import { format, subDays, differenceInDays } from "date-fns";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import AffiliateDashboardPage from "./afiliado/dashboard_component";

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#6366f1', '#8b5cf6'];

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  
  // Filtro padrão: últimos 7 dias
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd")
  });

  const { data: session } = useSession();

  const fetchFinance = useCallback(async () => {
    if (session?.user?.role === "AFFILIATE") return;
    setLoading(true);
    try {
      const [resFinance, resStore] = await Promise.all([
        fetch(`/api/finance?from=${dateRange.from}&to=${dateRange.to}`),
        fetch("/api/store")
      ]);
      
      const jsonFinance = await resFinance.json();
      const jsonStore = await resStore.json();
      
      if (!resFinance.ok) throw new Error(jsonFinance.error);
      setData(jsonFinance);
      setStore(jsonStore);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchFinance();
  }, [fetchFinance]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const { data: session } = useSession();

  if (session?.user?.role === "AFFILIATE") {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#0f0f1a]">
        <Header title="Painel do Afiliado" />
        <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
          <AffiliateDashboardPage />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Header title="Painel de Controle" />

      <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* STATUS DA ASSINATURA */}
        {store?.subscription && (() => {
          const expiresAt = new Date(store.subscription.expiresAt);
          const daysLeft = differenceInDays(expiresAt, new Date());
          const isExpiringSoon = daysLeft <= 5;
          const isExpired = daysLeft < 0;

          let bgColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-600";
          let icon = <Clock size={16} className="text-emerald-500" />;
          let label = `Assinatura Ativa: ${daysLeft} dias restantes`;

          if (isExpired) {
            bgColor = "bg-red-500/10 border-red-500/20 text-red-600";
            icon = <AlertTriangle size={16} className="text-red-500" />;
            label = "Assinatura Expirada";
          } else if (isExpiringSoon) {
            bgColor = "bg-purple-500/10 border-purple-500/20 text-purple-600";
            icon = <AlertTriangle size={16} className="text-purple-500" />;
            label = `Assinatura vencendo em ${daysLeft} dias! Renovação disponível.`;
          }

          return (
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm ${bgColor}`}>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/50 rounded-lg shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-black  tracking-widest">{label}</p>
                    <p className="text-[10px] font-bold opacity-70">Plano: {store.subscription.plan?.name} • Vencimento: {format(expiresAt, "dd/MM/yyyy")}</p>
                  </div>
               </div>

                {(isExpiringSoon || isExpired) && (
                  <Link 
                   href="/dashboard/subscription"
                   className="w-full md:w-auto px-6 py-2.5 bg-purple-500 text-white text-[10px] font-black  rounded-lg hover:bg-purple-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                  >
                    <Sparkles size={14} />
                    Renovar Assinatura
                  </Link>
                )}
            </div>
          );
        })()}

        {/* DOWNLOAD PDV DESKTOP DISCRETO */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                <Box size={16} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Versão Windows disponível para download</span>
           </div>
           <a 
             href="/downloads/pedeue-setup.exe" 
             download
             className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black tracking-widest hover:bg-purple-600 transition-all"
           >
              BAIXAR AGORA
           </a>
        </div>

        {/* RESUMO COM FILTROS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-2 text-slate-600">
              <BarChart3 size={20} className="text-purple-500" />
              <span className="text-sm font-black  tracking-widest text-navy">Performance da Loja</span>
           </div>

           <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2">
                 <Calendar size={14} className="text-slate-400 mr-2" />
                 <input 
                    type="date" 
                    className="bg-transparent py-2 text-xs font-bold outline-none" 
                    value={dateRange.from}
                    onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                 />
                 <span className="mx-2 text-slate-300">-</span>
                 <input 
                    type="date" 
                    className="bg-transparent py-2 text-xs font-bold outline-none"
                    value={dateRange.to}
                    onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                 />
              </div>
              <button 
                onClick={fetchFinance}
                className="bg-purple-500 text-white p-2.5 rounded-lg hover:bg-purple-600 transition-all shadow-md shadow-purple-500/20"
              >
                 <Search size={16} />
              </button>
           </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
            <span className="text-xs font-black  tracking-tighter text-slate-400">Sincronizando faturamento...</span>
          </div>
        ) : (
          <>
            {/* INDICADORES (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {(() => {
                 const common = [
                   { label: "Faturamento", value: formatCurrency(data?.summary?.totalRevenue || 0), icon: DollarSign, color: "text-purple-500", bg: "bg-purple-50" },
                   { label: "Pedidos", value: data?.summary?.orderCount || 0, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" },
                 ];

                 let specific = [];
                 if (store?.storeType === "SERVICE") {
                   specific = [
                     { label: "Em Produção", value: data?.summary?.processingCount || 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
                     { label: "Orçamentos", value: data?.summary?.pendingCount || 0, icon: ScrollText, color: "text-slate-500", bg: "bg-slate-50" },
                   ];
                 } else if (store?.storeType === "SHOWCASE") {
                   specific = [
                     { label: "Ticket Médio", value: formatCurrency(data?.summary?.averageTicket || 0), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
                     { label: "Clientes", value: data?.topCustomers?.length || 0, icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
                   ];
                 } else { // RESTAURANT
                   specific = [
                     { label: "Ticket Médio", value: formatCurrency(data?.summary?.averageTicket || 0), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
                     { label: "Atendimento", value: data?.topCustomers?.length || 0, icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
                   ];
                 }

                 return [...common, ...specific].map((card, i) => (
                   <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between">
                         <div>
                            <p className="text-[10px] font-black text-slate-400  tracking-widest mb-1">{card.label}</p>
                            <p className="text-xl font-black text-slate-800">{card.value}</p>
                         </div>
                         <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <card.icon size={20} />
                         </div>
                      </div>
                   </div>
                 ));
               })()}
            </div>

            {/* GRÁFICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-sm font-black text-navy  tracking-widest">Evolução do Faturamento</h3>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-400 ">Vendas Diárias</span>
                     </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.dailySales}>
                        <defs>
                          <linearGradient id="dashboardGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                          formatter={(val: any) => [formatCurrency(Number(val) || 0), "Faturamento"]}
                        />
                        <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#dashboardGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <h3 className="text-sm font-black text-navy  tracking-widest mb-8">Meios de Pagamento</h3>
                  <div className="flex-1 h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.paymentMethods} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" fontSize={10} width={90} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} formatter={(val: any) => formatCurrency(Number(val) || 0)} />
                        <Bar dataKey="Valor" radius={[0, 4, 4, 0]} barSize={24}>
                          {data?.paymentMethods?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>

            {/* TABELAS DE PERFORMANCE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/30">
                      <Users size={18} className="text-purple-500 mr-2" />
                      <h3 className="text-xs font-black text-navy  tracking-widest">Maiores Compradores</h3>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400  tracking-widest">
                               <th className="px-6 py-4">Cliente</th>
                               <th className="px-6 py-4 text-center">Pedidos</th>
                               <th className="px-6 py-4 text-right">Total</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                           {data?.topCustomers?.map((client: any, i: number) => (
                             <tr key={i} className="hover:bg-slate-50/50 transition-all font-medium">
                                <td className="px-6 py-4">
                                   <div className="text-xs font-bold text-slate-700">{client.name}</div>
                                   <div className="text-[9px] text-slate-400 font-bold">{client.email}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">{client.count}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-black text-xs text-navy">
                                   {formatCurrency(client.total)}
                                </td>
                             </tr>
                           ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                   <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/30">
                      <Package size={18} className="text-blue-500 mr-2" />
                      <h3 className="text-xs font-black text-navy  tracking-widest">Itens mais Vendidos</h3>
                   </div>
                   <div className="p-6 space-y-5 flex-1">
                      {data?.topProducts?.slice(0, 5).map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                 #{i+1}
                              </div>
                              <span className="text-xs font-bold text-slate-700">{p.name}</span>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black text-slate-400  tracking-tighter">{p.quantity} vendas</span>
                              <span className="text-xs font-black text-navy">{formatCurrency(p.total)}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="p-4 bg-purple-50 border-t border-purple-100">
                      <div className="flex items-center justify-between text-[10px] font-black  text-purple-600">
                         <span>Análise de itens concluída</span>
                         <ArrowUpRight size={14} />
                      </div>
                   </div>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
