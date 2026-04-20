"use client";

import { useState, useEffect } from "react";
import { 
  Store, 
  CreditCard, 
  Plus, 
  Calendar, 
  CheckCircle, 
  X, 
  TrendingUp, 
  Users, 
  Settings,
  LogOut,
  LayoutDashboard,
  Wallet,
  Globe,
  Trash2,
  Edit,
  Eye,
  ArrowUpRight,
  Printer,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Package,
  Menu,
  ArrowDownRight,
  Receipt,
  PiggyBank
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { signOut } from "next-auth/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  maxProducts: number;
  isActive: boolean;
  features?: string;
}

interface StoreData {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  subscription?: {
    id: string;
    expiresAt: string;
    status: string;
    plan: Plan;
  };
}

interface PlatformStats {
  totalStores: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  averageTicket: number;
  recentTransactions: any[];
  recentExpenses: any[];
  chartData: any[];
}

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stores, setStores] = useState<StoreData[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modais
  const [isManagingStore, setIsManagingStore] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [isAddingDays, setIsAddingDays] = useState(false);
  const [daysToAdd, setDaysToAdd] = useState("");
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // Formulários
  const initialPlanForm = { 
    name: "", 
    price: "", 
    maxProducts: "100", 
    description: "",
    features: {
      PDV_SYSTEM: true,
      TABLE_MANAGEMENT: false,
      DIGITAL_MENU: true,
      WAITER_APP: false,
      DELIVERY_SYSTEM: true,
      COUPON_SYSTEM: false,
      AUTO_PRINT: false
    }
  };
  const [planForm, setPlanForm] = useState(initialPlanForm);
  const [cityForm, setCityForm] = useState({ name: "", state: "" });
  const [expenseForm, setExpenseForm] = useState({
     title: "",
     amount: "",
     type: "FIXED",
     date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      const statsRes = await fetch("/api/superadmin/stats");
      if (statsRes.ok) setStats(await statsRes.json());
      
      const resStores = await fetch("/api/superadmin/stores");
      if (resStores.ok) setStores(await resStores.json());
      
      const resPlans = await fetch("/api/superadmin/plans");
      if (resPlans.ok) setPlans(await resPlans.json());
      
      const resCities = await fetch("/api/superadmin/cities");
      if (resCities.ok) setCities(await resCities.json());
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveExpense() {
     try {
       const res = await fetch("/api/superadmin/expenses", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(expenseForm)
       });
       if (!res.ok) throw new Error();
       toast.success("Gasto registrado!");
       setIsAddingExpense(false);
       setExpenseForm({ title: "", amount: "", type: "FIXED", date: new Date().toISOString().split('T')[0] });
       fetchData();
     } catch {
       toast.error("Erro ao salvar despesa");
     }
  }

  function openEditPlan(plan: Plan) {
    const features = plan.features ? JSON.parse(plan.features) : initialPlanForm.features;
    setPlanForm({
       name: plan.name,
       price: plan.price.toString(),
       maxProducts: plan.maxProducts.toString(),
       description: plan.description || "",
       features: { ...initialPlanForm.features, ...features }
    });
    setEditingPlanId(plan.id);
    setIsAddingPlan(true);
 }

  async function handleSavePlan() {
    try {
       const res = await fetch("/api/superadmin/plans", {
         method: editingPlanId ? "PUT" : "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(editingPlanId ? { ...planForm, id: editingPlanId } : planForm)
       });
       if (!res.ok) throw new Error();
       toast.success("Plano salvo!");
       setIsAddingPlan(false);
       fetchData();
    } catch {
       toast.error("Erro");
    }
  }

  async function handleChangePlan(planId: string) {
    if (!selectedStore) return;
    try {
      const res = await fetch(`/api/superadmin/stores/${selectedStore.id}/change-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId })
      });
      if (!res.ok) throw new Error();
      toast.success("Plano alterado!");
      fetchData();
    } catch {
      toast.error("Erro");
    }
  }

  async function handleAdjustDays() {
    if (!selectedStore || !daysToAdd) return;
    try {
      const res = await fetch(`/api/superadmin/stores/${selectedStore.id}/add-days`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: parseInt(daysToAdd) })
      });
      if (!res.ok) throw new Error();
      toast.success("Validade atualizada!");
      setIsAddingDays(false);
      setDaysToAdd("");
      fetchData();
    } catch {
      toast.error("Erro");
    }
  }

  async function handleCreateCity() {
    try {
       const res = await fetch("/api/superadmin/cities", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(cityForm)
       });
       if (!res.ok) throw new Error();
       toast.success("Cidade salva!");
       setIsAddingCity(false);
       fetchData();
    } catch {
       toast.error("Erro");
    }
  }

  const featureLabels: { [key: string]: string } = {
    PDV_SYSTEM: "PDV",
    TABLE_MANAGEMENT: "Mesas",
    DIGITAL_MENU: "Cardápio",
    WAITER_APP: "Garçom",
    DELIVERY_SYSTEM: "Entrega",
    COUPON_SYSTEM: "Cupons",
    AUTO_PRINT: "Auto-Print"
  };

  return (
    <div className="flex min-h-screen bg-slate-50 italic-none">
      
      {/* MOBILE HEADER - IDENTICO AO DASHBOARD */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#0f172a] h-16 flex items-center justify-between px-6 z-[60] italic-none">
          <div className="flex items-center gap-2">
             <ShieldCheck className="text-orange-500" size={24} />
             <h1 className="text-white font-black text-xl tracking-tighter uppercase italic-none">SUPER<span className="text-orange-500">ADMIN</span></h1>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white border-none bg-transparent">
             {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
      </header>

      {/* SIDEBAR - IDENTICA AO DASHBOARD DO LOJISTA */}
      <aside className={`
        w-72 h-screen bg-[#0f172a] flex flex-col fixed top-0 left-0 z-50 transition-all duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        rounded-none border-none italic-none shadow-[4px_0_24px_rgba(0,0,0,0.1)]
      `}>
        <div className="p-8 hidden lg:block italic-none">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-orange-500" size={32} />
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic-none">
                SUPER<span className="text-orange-500">ADMIN</span>
              </h1>
            </div>
        </div>

        <nav className="flex-1 px-4 mt-20 lg:mt-4 space-y-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "stores", label: "Lojistas", icon: Store },
            { id: "plans", label: "Planos SaaS", icon: CreditCard },
            { id: "cities", label: "Cidades", icon: Globe },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`
                w-full flex items-center justify-between px-6 py-4 rounded-none text-xs font-bold transition-all uppercase tracking-tight
                ${activeTab === item.id 
                  ? "bg-white/10 text-white border-r-4 border-orange-500" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"}
              `}
            >
              <div className="flex items-center gap-4 italic-none">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
              {activeTab === item.id && <ChevronRight size={14} className="opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 italic-none">
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-6 py-4 text-red-500 hover:bg-red-500/10 rounded-none transition-all font-bold text-xs uppercase italic-none"
          >
            <LogOut size={20} />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO - ESPELHANDO O ESTILO DO LOJISTA */}
      <main className="lg:ml-72 flex-1 p-6 md:p-10 space-y-10 min-w-0 mt-16 lg:mt-0 italic-none">
        
        {activeTab === "dashboard" && stats && (
           <div className="animate-in fade-in duration-300 space-y-10 italic-none">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 italic-none mb-10">
                 <div className="italic-none">
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic-none">Gestão Central</h2>
                    <p className="text-slate-500 text-lg font-medium italic-none">Visão geral da plataforma SaaS</p>
                 </div>
                 <button 
                   onClick={() => setIsAddingExpense(true)}
                   className="bg-orange-500 text-white px-8 py-4 rounded-none font-black text-xs uppercase tracking-widest shadow-xl hover:brightness-110 transition-all flex items-center gap-3 border-none"
                 >
                    <ArrowDownRight size={20} /> Lançar Despesa
                 </button>
              </div>

              {/* CARDS STATS - ESTILO DO LOJISTA */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 italic-none">
                 {[
                   { label: "Receita Total", value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: Wallet, color: "blue" },
                   { label: "Gastos Totais", value: `R$ ${stats.totalExpenses.toFixed(2)}`, icon: ArrowDownRight, color: "red" },
                   { label: "Lucro Líquido", value: `R$ ${stats.netProfit.toFixed(2)}`, icon: TrendingUp, color: "green" },
                   { label: "Lojas Ativas", value: stats.totalStores, icon: Store, color: "orange" }
                 ].map((card, i) => (
                   <div key={i} className="bg-white p-8 rounded-none border border-slate-100 shadow-sm hover:shadow-xl transition-all italic-none">
                      <div className={`w-12 h-12 mb-6 rounded-none flex items-center justify-center bg-slate-50 text-slate-900 border border-slate-100`}>
                        <card.icon size={24} />
                      </div>
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider italic-none mb-1">{card.label}</p>
                      <h3 className="text-3xl font-black text-slate-900 italic-none tracking-tight">{card.value}</h3>
                   </div>
                 ))}
              </div>

              {/* GRÁFICO - ESTILO DO LOJISTA */}
              <div className="bg-white p-8 rounded-none border border-slate-100 shadow-sm italic-none">
                 <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8 italic-none">Performance do SaaS</h3>
                 <div className="h-[350px] w-full italic-none">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={stats.chartData} barGap={8}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                          <Tooltip contentStyle={{borderRadius: 0, fontWeight: 'bold', fontSize: '14px', border: '1px solid #f1f5f9'}} />
                          <Bar dataKey="receita" fill="#0f172a" name="Receita" />
                          <Bar dataKey="custo" fill="#ef4444" name="Custos" />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 italic-none">
                 <div className="bg-white rounded-none border border-slate-100 shadow-sm italic-none overflow-hidden">
                    <div className="p-6 border-b border-slate-50 font-black uppercase text-sm text-slate-900 italic-none">Entradas Recentes</div>
                    <div className="divide-y divide-slate-50 italic-none">
                       {stats.recentTransactions.map((t: any) => (
                          <div key={t.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all font-bold italic-none">
                             <div className="italic-none">
                                <p className="text-slate-900 uppercase italic-none text-sm">{t.store?.name}</p>
                                <p className="text-slate-400 text-xs italic-none">{format(new Date(t.createdAt), 'dd/MM/yyyy')}</p>
                             </div>
                             <span className="text-green-600">+ R$ {t.amount.toFixed(2)}</span>
                          </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-white rounded-none border border-slate-100 shadow-sm italic-none overflow-hidden">
                    <div className="p-6 border-b border-slate-50 font-black uppercase text-sm text-slate-900 italic-none">Saídas de Caixa</div>
                    <div className="divide-y divide-slate-50 italic-none">
                       {stats.recentExpenses.map((e: any) => (
                          <div key={e.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all font-bold italic-none">
                             <div className="italic-none">
                                <p className="text-slate-900 uppercase italic-none text-sm">{e.title}</p>
                                <p className="text-slate-400 text-[10px] uppercase italic-none">{e.type}</p>
                             </div>
                             <span className="text-red-500">- R$ {e.amount.toFixed(2)}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === "stores" && (
           <div className="animate-in slide-in-from-right duration-300 space-y-10 italic-none">
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic-none">Gestão de Lojas</h2>
              <div className="bg-white rounded-none border border-slate-100 shadow-sm overflow-x-auto italic-none">
                 <table className="w-full text-left italic-none min-w-[800px]">
                    <thead className="bg-slate-50 border-b border-slate-100 italic-none text-xs font-black uppercase text-slate-500">
                       <tr>
                          <th className="p-8">Estabelecimento</th>
                          <th className="p-8">Assinatura</th>
                          <th className="p-8">Vencimento</th>
                          <th className="p-8 text-center">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 italic-none">
                       {stores.map(store => {
                          const isExpired = store.subscription ? new Date(store.subscription.expiresAt) < new Date() : true;
                          return (
                            <tr key={store.id} className="hover:bg-slate-50 transition-all font-bold text-sm italic-none">
                               <td className="p-8 italic-none">
                                  <p className="text-slate-900 uppercase italic-none">{store.name}</p>
                                  <p className="text-slate-400 text-xs font-medium italic-none">/{store.slug}</p>
                               </td>
                               <td className="p-8 italic-none">
                                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-none uppercase text-xs border border-slate-200">{store.subscription?.plan?.name || "TRIAL"}</span>
                               </td>
                               <td className="p-8 italic-none">
                                  <span className={isExpired ? 'text-red-500 underline decoration-2' : 'text-slate-700'}>
                                     {store.subscription ? format(new Date(store.subscription.expiresAt), 'dd/MM/yyyy') : 'EXPIRADO'}
                                  </span>
                               </td>
                               <td className="p-8 text-center italic-none">
                                  <button onClick={() => { setSelectedStore(store); setIsManagingStore(true); }} className="bg-[#0f172a] text-white px-6 py-3 rounded-none text-xs font-black uppercase tracking-widest hover:bg-orange-500 border-none italic-none transition-all">Gerenciar</button>
                               </td>
                            </tr>
                          )
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* ... (Telas de Planos e Cidades com design Square e identico ao lojista) ... */}
        {activeTab === "plans" && (
           <div className="animate-in slide-in-from-right duration-300 space-y-10 italic-none">
              <div className="flex items-center justify-between italic-none">
                 <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic-none">Planos do Sistema</h2>
                 <button onClick={() => { setPlanForm(initialPlanForm); setEditingPlanId(null); setIsAddingPlan(true); }} className="bg-orange-500 text-white px-8 py-4 rounded-none font-black text-xs uppercase tracking-widest shadow-xl border-none italic-none">Criar Plano</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 italic-none">
                 {plans.map(plan => (
                    <div key={plan.id} className="bg-white p-10 rounded-none border border-slate-100 shadow-sm border-t-8 border-t-[#0f172a] flex flex-col italic-none hover:shadow-2xl transition-all">
                       <h4 className="text-2xl font-black text-slate-900 uppercase italic-none mb-2">{plan.name}</h4>
                       <p className="text-xl font-bold text-orange-500 italic-none mb-8">R$ {plan.price.toFixed(2)}/mês</p>
                       <div className="space-y-4 mb-10 flex-1 italic-none text-xs font-bold text-slate-600 uppercase">
                          <p className="flex items-center gap-3"><Package size={16} className="text-slate-300"/> Até {plan.maxProducts} Produtos</p>
                          {Object.entries(plan.features ? JSON.parse(plan.features) : {}).map(([key, e]) => e && (
                             <p key={key} className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500"/> {featureLabels[key] || key}</p>
                          ))}
                       </div>
                       <button onClick={() => openEditPlan(plan)} className="w-full py-4 bg-[#0f172a] text-white rounded-none font-black text-xs uppercase hover:bg-orange-500 transition-all border-none italic-none">Editar Configuração</button>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === "cities" && (
           <div className="animate-in slide-in-from-right duration-300 space-y-10 italic-none">
              <div className="flex items-center justify-between italic-none">
                 <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic-none">Cobertura</h2>
                 <button onClick={() => setIsAddingCity(true)} className="bg-[#0f172a] text-white px-8 py-4 rounded-none font-black text-xs uppercase italic-none border-none">Cadastrar Cidade</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 italic-none">
                 {cities.map(city => (
                    <div key={city.id} className="bg-white p-8 rounded-none border border-slate-100 shadow-sm flex items-center justify-between italic-none text-nowrap">
                       <div className="italic-none">
                          <p className="font-black text-slate-900 uppercase text-lg italic-none">{city.name}</p>
                          <p className="text-sm font-bold text-orange-500 uppercase italic-none">{city.state}</p>
                       </div>
                       <Globe size={24} className="text-slate-100" />
                    </div>
                 ))}
              </div>
           </div>
        )}
      </main>

      {/* MODAL GESTÃO DE LOJA (IDENTICO AO DASHBOARD DO LOJISTA) */}
      {isManagingStore && selectedStore && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm italic-none">
              <div className="bg-white w-full max-w-2xl rounded-none p-10 relative shadow-2xl italic-none animate-in zoom-in-95 duration-200">
                 <button onClick={() => setIsManagingStore(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 border-none outline-none italic-none"><X size={28}/></button>
                 <div className="flex items-center gap-8 mb-10 pb-8 border-b border-slate-100 italic-none">
                    <div className="w-20 h-20 bg-slate-100 rounded-none flex items-center justify-center font-black text-slate-400 italic-none text-3xl uppercase">{selectedStore.name.charAt(0)}</div>
                    <div className="italic-none">
                        <h3 className="text-3xl font-black text-slate-900 uppercase italic-none tracking-tighter">{selectedStore.name}</h3>
                        <p className="text-sm font-bold text-orange-500 italic-none">Lojista Parceiro</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10 italic-none">
                    <div className="space-y-8 italic-none">
                        <div className="space-y-2 italic-none">
                           <p className="text-xs font-black text-slate-400 uppercase italic-none">Definir Plano SaaS</p>
                           <select className="w-full bg-slate-50 border border-slate-200 p-5 rounded-none font-bold text-sm uppercase outline-none italic-none" value={selectedStore.subscription?.plan?.id || ""} onChange={(e) => handleChangePlan(e.target.value)}>
                              <option value="">SELECIONAR PLANO</option>
                              {plans.map(p => ( <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option> ))}
                           </select>
                        </div>
                        <div className="space-y-2 italic-none">
                           <p className="text-xs font-black text-slate-400 uppercase italic-none">Validade de Acesso</p>
                           <div className="p-5 bg-[#0f172a] text-white rounded-none italic-none font-black text-lg text-center">
                              {selectedStore.subscription ? format(new Date(selectedStore.subscription.expiresAt), 'dd/MM/yyyy') : 'EXPIRADO'}
                           </div>
                           <button onClick={() => setIsAddingDays(true)} className="w-full py-4 border-4 border-slate-100 text-slate-400 rounded-none font-black text-xs uppercase hover:bg-slate-50 transition-all italic-none mt-2">Alterar Dias de Acesso</button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 italic-none">
                        <p className="text-xs font-black text-slate-400 uppercase italic-none">Acesso e Visualização</p>
                        <button onClick={() => window.open(`/api/superadmin/impersonate?storeId=${selectedStore.id}`, '_blank')} className="w-full flex items-center justify-between p-6 bg-orange-500 text-white rounded-none font-black text-xs uppercase shadow-xl hover:brightness-110 transition-all italic-none border-none">
                           <span className="flex items-center gap-3"><ExternalLink size={20}/> Entrar no Painel</span>
                           <ChevronRight size={20} />
                        </button>
                        <button onClick={() => window.open(`/loja/${selectedStore.slug}`, '_blank')} className="w-full py-5 bg-slate-900 text-white rounded-none font-black text-xs uppercase hover:bg-[#0f172a] transition-all italic-none border-none">Ver Cardápio Público</button>
                    </div>
                 </div>
              </div>
           </div>
        )}

      {/* MODAL REGISTRAR GASTO */}
      {isAddingExpense && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm italic-none">
            <div className="bg-white w-full max-w-lg rounded-none p-12 relative shadow-2xl border-l-[16px] border-red-500 italic-none">
               <button onClick={() => setIsAddingExpense(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 italic-none border-none outline-none"><X size={28}/></button>
               <h3 className="text-3xl font-black text-slate-900 uppercase text-center mb-10 italic-none tracking-tighter">Lançar Despesa</h3>
               <div className="space-y-8 italic-none">
                  <div className="space-y-2 italic-none">
                     <p className="text-xs font-black text-slate-400 uppercase italic-none">Descrição da Saída</p>
                     <input className="w-full border-2 border-slate-100 p-5 rounded-none font-bold text-sm uppercase outline-none focus:border-red-500 italic-none bg-slate-50" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="grid grid-cols-2 gap-6 italic-none">
                     <div className="space-y-2 italic-none">
                        <p className="text-xs font-black text-slate-400 uppercase italic-none">Valor (R$)</p>
                        <input className="w-full border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-red-500 italic-none bg-slate-50" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                     </div>
                     <div className="space-y-2 italic-none">
                        <p className="text-xs font-black text-slate-400 uppercase italic-none">Categoria</p>
                        <select className="w-full border-2 border-slate-100 p-5 rounded-none font-bold text-xs uppercase bg-slate-50 italic-none outline-none" value={expenseForm.type} onChange={e => setExpenseForm({...expenseForm, type: e.target.value})}>
                           <option value="FIXED">FIXO</option>
                           <option value="VARIABLE">VARIÁVEL</option>
                           <option value="WITHDRAWAL">SANGRIA</option>
                        </select>
                     </div>
                  </div>
                  <input type="date" className="w-full border-2 border-slate-100 p-5 rounded-none font-bold text-sm italic-none bg-slate-50 outline-none" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
                  <button onClick={handleSaveExpense} className="w-full bg-red-600 text-white py-6 rounded-none font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-slate-900 transition-all border-none italic-none">Efetivar Lançamento</button>
               </div>
            </div>
         </div>
      )}

      {/* MODAL PLANO (NOVO/EDITAR) */}
      {isAddingPlan && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm italic-none">
            <div className="bg-white w-full max-w-2xl rounded-none p-12 relative shadow-2xl border-t-[12px] border-[#0f172a] italic-none">
               <button onClick={() => setIsAddingPlan(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 border-none outline-none italic-none"><X size={28}/></button>
               <h3 className="text-3xl font-black text-slate-900 uppercase text-center mb-10 italic-none tracking-tighter">{editingPlanId ? 'Ajustar Plano' : 'Novo Plano'}</h3>
               <div className="space-y-8 italic-none">
                  <div className="grid grid-cols-2 gap-6 italic-none">
                     <input className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm uppercase outline-none focus:border-[#0f172a] italic-none" placeholder="NOME DO PLANO" value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value.toUpperCase()})} />
                     <input className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-[#0f172a] italic-none" placeholder="PREÇO MENSAL" value={planForm.price} onChange={e => setPlanForm({...planForm, price: e.target.value})} />
                  </div>
                  <input className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-[#0f172a] italic-none" placeholder="QUANTIDADE DE PRODUTOS" value={planForm.maxProducts} onChange={e => setPlanForm({...planForm, maxProducts: e.target.value})} />
                  <div className="space-y-4 italic-none pt-2">
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic-none">Recursos Disponíveis</p>
                     <div className="grid grid-cols-2 gap-3 italic-none">
                        {Object.entries(planForm.features).map(([key, e]) => (
                           <button key={key} onClick={() => setPlanForm({...planForm, features: {...planForm.features, [key]: !e}})} className={`text-[10px] font-black uppercase p-5 border-2 rounded-none transition-all ${e ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-400 border-slate-100'}`}>
                              {featureLabels[key] || key}
                           </button>
                        ))}
                     </div>
                  </div>
                  <button onClick={handleSavePlan} className="w-full bg-[#0f172a] text-white py-6 rounded-none font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-orange-500 transition-all italic-none border-none">Gravar Configurações</button>
               </div>
            </div>
         </div>
      )}

      {/* MODAL ADICIONAR DIAS */}
      {isAddingDays && selectedStore && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm italic-none">
            <div className="bg-white w-full max-w-md rounded-none p-10 relative shadow-2xl italic-none border-2 border-slate-100">
               <button onClick={() => setIsAddingDays(false)} className="absolute top-6 right-6 text-slate-300 italic-none border-none outline-none"><X size={24}/></button>
               <h4 className="text-lg font-black uppercase text-center mb-8 italic-none tracking-tighter decoration-orange-500 underline decoration-4">Soma de Dias Manuais</h4>
               <input type="number" className="w-full bg-slate-50 p-6 rounded-none text-center text-5xl font-black italic-none outline-none border-2 border-slate-100 focus:bg-white mb-8" placeholder="0" value={daysToAdd} onChange={e => setDaysToAdd(e.target.value)} />
               <button onClick={handleAdjustDays} className="w-full bg-slate-900 text-white py-5 rounded-none font-black uppercase text-xs tracking-widest italic-none border-none shadow-xl">Confirmar Ajuste</button>
            </div>
         </div>
      )}

      {/* MODAL CIDADE */}
      {isAddingCity && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm italic-none">
           <div className="bg-white w-full max-w-md rounded-none p-12 relative shadow-2xl border-2 border-slate-100 italic-none">
              <button onClick={() => setIsAddingCity(false)} className="absolute top-8 right-8 text-slate-300 italic-none border-none outline-none"><X size={24}/></button>
              <h3 className="text-xl font-black uppercase tracking-tight mb-10 text-center italic-none">Registrar Cidade de Atendimento</h3>
              <div className="space-y-6 italic-none">
                 <input className="w-full border-2 border-slate-100 p-5 rounded-none font-bold text-sm uppercase outline-none focus:border-orange-500 italic-none bg-slate-50" placeholder="NOME DA CIDADE" value={cityForm.name} onChange={e => setCityForm({...cityForm, name: e.target.value.toUpperCase()})} />
                 <input className="w-full border-2 border-slate-100 p-5 rounded-none font-bold text-sm uppercase outline-none focus:border-orange-500 italic-none bg-slate-50" placeholder="UF (EX: SP)" value={cityForm.state} onChange={e => setCityForm({...cityForm, state: e.target.value.toUpperCase()})} maxLength={2} />
                 <button onClick={handleCreateCity} className="w-full bg-slate-900 text-white py-5 rounded-none font-black uppercase text-xs tracking-widest italic-none shadow-xl border-none">Concluir Cadastro</button>
              </div>
           </div>
         </div>
      )}

    </div>
  );
}
