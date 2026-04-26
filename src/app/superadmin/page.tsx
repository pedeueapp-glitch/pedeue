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
  PiggyBank,
  Loader2,
  Activity,
  Cpu,
  HardDrive,
  Terminal,
  RefreshCw,
  Server,
  Database,
  Download,
  History,
  ScrollText,
  AlertTriangle,
  LifeBuoy,
  ClipboardList,
  Layers
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
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Suspense } from "react";

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  maxProducts: number;
  isActive: boolean;
  features?: string;
  allowedStoreTypes: string;
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

const initialPlanForm = { 
  name: "", 
  price: "", 
  maxProducts: "100", 
  description: "",
  allowedStoreTypes: ["RESTAURANT", "SHOWCASE", "SERVICE"],
  features: {
    PDV_SYSTEM: true,
    TABLE_MANAGEMENT: false,
    DIGITAL_MENU: true,
    WAITER_APP: false,
    DELIVERY_SYSTEM: true,
    COUPON_SYSTEM: false,
    AUTO_PRINT: false,
    CASHBACK_SYSTEM: false,
    REPORTS: false,
    CUSTOM_COLOR: false,
    PRODUCT_DUPLICATION: false,
    CUSTOM_DOMAIN: false,
    ADVANCED_CATALOGS: false,
    UPSELL_RULES: false,
    HEATMAP: false
  }
};

function SuperAdminContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "dashboard";
  
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const [stores, setStores] = useState<StoreData[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [vpsData, setVpsData] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [trafficHistory, setTrafficHistory] = useState<any[]>([]);
  const [lastNet, setLastNet] = useState<{rx: number, tx: number} | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Novos Estados
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [isAddingAffiliate, setIsAddingAffiliate] = useState(false);
  const [affiliateForm, setAffiliateForm] = useState({ name: "", email: "", password: "", pixKey: "", commissionRate: "10" });
  
  // Modais Adicionais
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketReply, setTicketReply] = useState("");

  // Modais
  const [isManagingStore, setIsManagingStore] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [isAddingDays, setIsAddingDays] = useState(false);
  const [daysToAdd, setDaysToAdd] = useState("");
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Formulários

  const [planForm, setPlanForm] = useState(initialPlanForm);
  const [cityForm, setCityForm] = useState({ name: "", state: "" });
  const [expenseForm, setExpenseForm] = useState({
     title: "",
     amount: "",
     type: "FIXED",
     date: new Date().toISOString().split('T')[0]
  });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER"
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

      const resUsers = await fetch("/api/superadmin/users");
      if (resUsers.ok) setUsers(await resUsers.json());
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "backups") {
      fetchBackups();
    }
  }, [activeTab]);

  async function fetchBackups() {
    try {
      const res = await fetch("/api/superadmin/backups");
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups);
      }
    } catch (e) {
      toast.error("Erro ao carregar backups");
    }
  }

  async function fetchHealth() {
    try {
      const res = await fetch("/api/superadmin/health");
      if (res.ok) setHealthStatus(await res.json());
    } catch (e) { console.error(e); }
  }

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/superadmin/analytics");
      if (res.ok) setAnalyticsData(await res.json());
    } catch (e) { console.error(e); }
  }

  async function fetchAnnouncements() {
    try {
      const res = await fetch("/api/superadmin/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements);
      }
    } catch (e) { console.error(e); }
  }

  async function fetchTickets() {
    try {
      const res = await fetch("/api/superadmin/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
      }
    } catch (e) { console.error(e); }
  }

  async function fetchAuditLogs() {
    try {
      const res = await fetch("/api/superadmin/audit");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs);
      }
    } catch (e) { console.error(e); }
  }

  async function fetchPayments() {
    try {
      const res = await fetch("/api/superadmin/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.transactions);
      }
    } catch (e) { console.error(e); }
  }

  async function fetchWebhooks() {
    try {
      const res = await fetch("/api/superadmin/webhooks");
      if (res.ok) {
        const data = await res.json();
        setWebhookLogs(data.logs);
      }
    } catch (e) { console.error(e); }
  }

  async function fetchAffiliates() {
    try {
      const res = await fetch("/api/superadmin/afiliados");
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data.affiliates);
      }
    } catch (e) { console.error(e); }
  }

  async function handleSaveAffiliate() {
    try {
      const res = await fetch("/api/superadmin/afiliados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...affiliateForm,
          commissionRate: parseFloat(affiliateForm.commissionRate) / 100
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Afiliado cadastrado!");
      setIsAddingAffiliate(false);
      setAffiliateForm({ name: "", email: "", password: "", pixKey: "", commissionRate: "10" });
      fetchAffiliates();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar afiliado");
    }
  }

  async function handleToggleAffiliate(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/superadmin/afiliados/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", isActive: !isActive })
      });
      if (res.ok) {
        toast.success(isActive ? "Afiliado desativado!" : "Afiliado ativado!");
        fetchAffiliates();
      }
    } catch { toast.error("Erro ao alterar status"); }
  }

  async function handleMarkCommissionPaid(commissionId: string) {
    try {
      const res = await fetch(`/api/superadmin/comissoes/${commissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        toast.success("Comissão marcada como paga!");
        fetchAffiliates();
      }
    } catch { toast.error("Erro ao marcar comissão"); }
  }

  async function fetchExpiration() {
    try {
      const res = await fetch("/api/superadmin/expiration");
      if (res.ok) {
        const data = await res.json();
        setExpiringSoon(data.expiringSoon);
      }
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    if (activeTab === "health") fetchHealth();
    if (activeTab === "analytics") fetchAnalytics();
    if (activeTab === "broadcast") fetchAnnouncements();
    if (activeTab === "support") fetchTickets();
    if (activeTab === "audit") fetchAuditLogs();
    if (activeTab === "payments") fetchPayments();
    if (activeTab === "webhooks") fetchWebhooks();
    if (activeTab === "expiration") fetchExpiration();
    if (activeTab === "affiliates") fetchAffiliates();
  }, [activeTab]);

  async function handleToggleStoreActive(id: string, currentStatus: boolean) {
     try {
        const res = await fetch("/api/superadmin/stores", {
           method: "PATCH",
           body: JSON.stringify({ id, isActive: !currentStatus })
        });
        if (res.ok) {
           toast.success(`Loja ${!currentStatus ? 'ativada' : 'bloqueada'} com sucesso!`);
           fetchData();
        }

     } catch (e) { toast.error("Falha ao alterar status"); }
  }

  async function handleCreateBackup() {
    const loadingToast = toast.loading("Gerando novo backup...");
    try {
      const res = await fetch("/api/superadmin/backups", {
        method: "POST",
        body: JSON.stringify({ action: "create" })
      });
      if (res.ok) {
        toast.success("Backup criado com sucesso!", { id: loadingToast });
        fetchBackups();
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro ao criar backup", { id: loadingToast });
    }
  }

  async function handleRestoreBackup(filename: string) {
    if (!confirm(`TEM CERTEZA? Isso irá substituir todos os dados atuais do banco pelo backup: ${filename}. Esta ação não pode ser desfeita.`)) return;
    
    const loadingToast = toast.loading("Restaurando banco de dados... Não feche esta janela.");
    try {
      const res = await fetch("/api/superadmin/backups", {
        method: "POST",
        body: JSON.stringify({ action: "restore", filename })
      });
      if (res.ok) {
        toast.success("Restauração concluída!", { id: loadingToast });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro crítico na restauração!", { id: loadingToast });
    }
  }

  async function handleDownloadBackup(filename: string) {
    try {
      window.open(`/api/superadmin/backups?filename=${filename}`, '_blank');
      toast.success("Download iniciado!");
    } catch (e) {
      toast.error("Erro ao baixar backup");
    }
  }

  useEffect(() => {
    let interval: any;
    if (activeTab === "vps") {
      fetchVpsData();
      interval = setInterval(fetchVpsData, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  async function fetchVpsData() {
    try {
      const res = await fetch("/api/superadmin/vps");
      if (res.ok) {
        const data = await res.json();
        setVpsData(data);

        // Lógica de tráfego
        if (lastNet) {
          const diffRx = Math.max(0, data.vps.network.rx - lastNet.rx);
          const diffTx = Math.max(0, data.vps.network.tx - lastNet.tx);
          
          const newPoint = {
            time: format(new Date(), 'HH:mm:ss'),
            in: Number((diffRx / 1024 / 5).toFixed(2)), // KB/s
            out: Number((diffTx / 1024 / 5).toFixed(2))
          };

          setTrafficHistory(prev => {
            const next = [...prev, newPoint];
            return next.length > 30 ? next.slice(1) : next;
          });
        }
        setLastNet(data.vps.network);
      }
    } catch (e) {
      console.error("Erro ao carregar dados da VPS", e);
    }
  }

  async function handleSaveUser() {
    try {
      const isEditing = !!selectedUser;
      const res = await fetch(isEditing ? `/api/superadmin/users/${selectedUser.id}` : "/api/superadmin/users", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm)
      });
      if (!res.ok) throw new Error();
      toast.success(isEditing ? "Usuário atualizado!" : "Usuário criado!");
      setIsEditingUser(false);
      fetchData();
    } catch {
      toast.error("Erro ao salvar usuário");
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Tem certeza que deseja excluir esta conta?")) return;
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      toast.success("Usuário removido!");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
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
       allowedStoreTypes: plan.allowedStoreTypes ? plan.allowedStoreTypes.split(',') : ["RESTAURANT", "SHOWCASE", "SERVICE"],
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

  async function handleDeletePlan(id: string) {
    if (!confirm("Tem certeza que deseja excluir este plano? Lojistas assinando este plano podem ter problemas.")) return;
    try {
      const res = await fetch(`/api/superadmin/plans?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Plano excluído!");
        fetchData();
      }
    } catch {
      toast.error("Erro ao excluir plano");
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
    AUTO_PRINT: "Auto-Print",
    CASHBACK_SYSTEM: "Cashback",
    REPORTS: "Relatórios",
    CUSTOM_COLOR: "Cor Personalizada",
    PRODUCT_DUPLICATION: "Duplicar Prod.",
    CUSTOM_DOMAIN: "Domínio Próprio",
    ADVANCED_CATALOGS: "Catálogos Avanç.",
    UPSELL_RULES: "Upsell Marketing",
    HEATMAP: "Mapa de Calor"
  };

  if (loading && !stats) return (
     <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" />
     </div>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Administração Geral" />

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 p-6 md:p-10 space-y-10 min-w-0">
        
        {activeTab === "dashboard" && stats && (
           <div className="animate-in fade-in duration-300 space-y-10">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                 <div>
                    <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Gestão Central</h2>
                    <p className="text-slate-500 text-lg font-medium">Visão geral da plataforma SaaS</p>
                 </div>
                 <button 
                   onClick={() => setIsAddingExpense(true)}
                   className="bg-purple-500 text-white px-8 py-4 rounded-none font-black text-xs  tracking-widest shadow-xl hover:brightness-110 transition-all flex items-center gap-3 border-none"
                 >
                    <ArrowDownRight size={20} /> Lançar Despesa
                 </button>
              </div>

              {/* CARDS STATS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {[
                   { label: "Receita Total", value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: Wallet, color: "blue" },
                   { label: "Gastos Totais", value: `R$ ${stats.totalExpenses.toFixed(2)}`, icon: ArrowDownRight, color: "red" },
                   { label: "Lucro Líquido", value: `R$ ${stats.netProfit.toFixed(2)}`, icon: TrendingUp, color: "green" },
                   { label: "Lojas Ativas", value: stats.totalStores, icon: Store, color: "orange" }
                 ].map((card, i) => (
                   <div key={i} className="bg-white p-8 rounded-none border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                      <div className={`w-12 h-12 mb-6 rounded-none flex items-center justify-center bg-slate-50 text-slate-900 border border-slate-100`}>
                        <card.icon size={24} />
                      </div>
                      <p className="text-xs font-bold  text-slate-500 tracking-wider mb-1">{card.label}</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</h3>
                   </div>
                 ))}
              </div>

              {/* GRÁFICO */}
              <div className="bg-white p-8 rounded-none border border-slate-100 shadow-sm">
                 <h3 className="text-lg font-black text-slate-900  tracking-tight mb-8">Performance do SaaS</h3>
                 <div className="h-[350px] w-full">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white rounded-none border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 font-black  text-sm text-slate-900">Entradas Recentes</div>
                    <div className="divide-y divide-slate-50">
                       {stats.recentTransactions.map((t: any) => (
                          <div key={t.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all font-bold">
                             <div>
                                <p className="text-slate-900  text-sm">{t.store?.name}</p>
                                <p className="text-slate-400 text-xs">{format(new Date(t.createdAt), 'dd/MM/yyyy')}</p>
                             </div>
                             <span className="text-green-600">+ R$ {t.amount.toFixed(2)}</span>
                          </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-white rounded-none border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 font-black  text-sm text-slate-900">Saídas de Caixa</div>
                    <div className="divide-y divide-slate-50">
                       {stats.recentExpenses.map((e: any) => (
                          <div key={e.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all font-bold">
                             <div>
                                <p className="text-slate-900  text-sm">{e.title}</p>
                                <p className="text-slate-400 text-[10px] ">{e.type}</p>
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
           <div className="animate-in slide-in-from-right duration-300 space-y-10">
              <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Gestão de Lojas</h2>
              <div className="bg-white rounded-none border border-slate-100 shadow-sm overflow-x-auto">
                 <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs font-black  text-slate-500">
                       <tr>
                          <th className="p-8">Estabelecimento</th>
                          <th className="p-8">Assinatura</th>
                          <th className="p-8">Vencimento</th>
                          <th className="p-8 text-center">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {stores.map(store => {
                          const isExpired = store.subscription ? new Date(store.subscription.expiresAt) < new Date() : true;
                          return (
                            <tr key={store.id} className="hover:bg-slate-50 transition-all font-bold text-sm">
                               <td className="p-8">
                                  <p className="text-slate-900 ">{store.name}</p>
                                  <p className="text-slate-400 text-xs font-medium">/{store.slug}</p>
                               </td>
                               <td className="p-8">
                                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-none  text-xs border border-slate-200">{store.subscription?.plan?.name || "TRIAL"}</span>
                               </td>
                               <td className="p-8">
                                  <span className={isExpired ? 'text-red-500 underline decoration-2' : 'text-slate-700'}>
                                     {store.subscription ? format(new Date(store.subscription.expiresAt), 'dd/MM/yyyy') : 'EXPIRADO'}
                                  </span>
                               </td>
                               <td className="p-8 text-center space-x-3">
                                  <button 
                                     onClick={() => handleToggleStoreActive(store.id, store.isActive)}
                                     className={`px-4 py-3 rounded-none text-xs font-black  tracking-widest border-none transition-all ${store.isActive ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'}`}
                                  >
                                     {store.isActive ? 'Bloquear' : 'Ativar'}
                                  </button>
                                  <button onClick={() => { setSelectedStore(store); setIsManagingStore(true); }} className="bg-[#0f172a] text-white px-6 py-3 rounded-none text-xs font-black  tracking-widest hover:bg-purple-500 border-none transition-all">Gerenciar</button>
                               </td>

                            </tr>
                          )
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* GESTÃO DE USUÁRIOS */}
        {activeTab === "users" && (
           <div className="animate-in slide-in-from-right duration-300 space-y-10">
              <div className="flex items-center justify-between">
                 <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Gestão de Contas</h2>
                 <button onClick={() => { 
                   setSelectedUser(null); 
                   setUserForm({ name: "", email: "", password: "", role: "USER" });
                   setIsEditingUser(true); 
                 }} className="bg-purple-500 text-white px-8 py-4 rounded-none font-black text-xs  tracking-widest shadow-xl border-none">Criar Conta</button>
              </div>
              <div className="bg-white rounded-none border border-slate-100 shadow-sm overflow-x-auto">
                 <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs font-black  text-slate-500">
                       <tr>
                          <th className="p-8">Usuário</th>
                          <th className="p-8">Nível de Acesso</th>
                          <th className="p-8">Vínculo</th>
                          <th className="p-8 text-center">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {users.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-all font-bold text-sm">
                             <td className="p-8">
                                <p className="text-slate-900 ">{user.name}</p>
                                <p className="text-slate-400 text-xs font-medium">{user.email}</p>
                             </td>
                             <td className="p-8">
                                <span className={`px-3 py-1 rounded-none  text-[10px] border ${user.role === 'SUPERADMIN' ? 'bg-purple-500 text-white border-purple-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                  {user.role}
                                </span>
                             </td>
                             <td className="p-8">
                                <p className="text-slate-600 text-xs ">{user.store?.name || "Sem Loja"}</p>
                             </td>
                             <td className="p-8 text-center space-x-2">
                                <button onClick={() => {
                                  setSelectedUser(user);
                                  setUserForm({ name: user.name, email: user.email, password: "", role: user.role });
                                  setIsEditingUser(true);
                                }} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-none text-[10px] font-black  hover:bg-slate-200 border-none transition-all">Editar</button>
                                <button onClick={() => handleDeleteUser(user.id)} className="bg-red-50 text-red-600 px-4 py-2 rounded-none text-[10px] font-black  hover:bg-red-100 border-none transition-all">Excluir</button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === "plans" && (
           <div className="animate-in slide-in-from-right duration-300 space-y-10 italic-none">
              <div className="flex items-center justify-between italic-none">
                 <h2 className="text-4xl font-black text-slate-900  tracking-tighter italic-none">Planos do Sistema</h2>
                 <button onClick={() => { setPlanForm(initialPlanForm); setEditingPlanId(null); setIsAddingPlan(true); }} className="bg-purple-500 text-white px-8 py-4 rounded-none font-black text-xs  tracking-widest shadow-xl border-none italic-none">Criar Plano</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 italic-none">
                 {plans.map(plan => (
                    <div key={plan.id} className="bg-white p-10 rounded-none border border-slate-100 shadow-sm border-t-8 border-t-[#0f172a] flex flex-col italic-none hover:shadow-2xl transition-all">
                       <h4 className="text-2xl font-black text-slate-900  italic-none mb-2">{plan.name}</h4>
                       <p className="text-xl font-bold text-purple-500 italic-none mb-8">R$ {plan.price.toFixed(2)}/mês</p>
                       <div className="space-y-4 mb-10 flex-1 italic-none text-xs font-bold text-slate-600 ">
                          <p className="flex items-center gap-3"><Package size={16} className="text-slate-300"/> Até {plan.maxProducts} Produtos</p>
                          {Object.entries(plan.features ? JSON.parse(plan.features) : {}).map(([key, e]: [string, any]) => e && (
                             <p key={key} className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500"/> {(featureLabels as any)[key] || key}</p>
                          ))}
                       </div>
                       <div className="flex gap-2">
                           <button onClick={() => openEditPlan(plan)} className="flex-1 py-4 bg-[#0f172a] text-white rounded-none font-black text-xs  hover:bg-purple-500 transition-all border-none italic-none">Editar</button>
                           <button onClick={() => handleDeletePlan(plan.id)} className="p-4 bg-red-50 text-red-600 rounded-none hover:bg-red-600 hover:text-white transition-all border-none flex items-center justify-center">
                              <Trash2 size={18} />
                           </button>
                        </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === "cities" && (
           <div className="animate-in slide-in-from-right duration-300 space-y-10 italic-none">
              <div className="flex items-center justify-between italic-none">
                 <h2 className="text-4xl font-black text-slate-900  tracking-tighter italic-none">Cobertura</h2>
                 <button onClick={() => setIsAddingCity(true)} className="bg-[#0f172a] text-white px-8 py-4 rounded-none font-black text-xs  italic-none border-none">Cadastrar Cidade</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 italic-none">
                 {cities.map(city => (
                    <div key={city.id} className="bg-white p-8 rounded-none border border-slate-100 shadow-sm flex items-center justify-between italic-none text-nowrap">
                       <div className="italic-none">
                          <p className="font-black text-slate-900  text-lg italic-none">{city.name}</p>
                          <p className="text-sm font-bold text-purple-500  italic-none">{city.state}</p>
                       </div>
                       <Globe size={24} className="text-slate-100" />
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === "vps" && (
           <div className="animate-in fade-in duration-300 space-y-10">
              <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Status da VPS</h2>
                  <div className="flex items-center gap-3">
                     <span className="flex items-center gap-2 text-[10px] font-black text-green-500  bg-green-500/10 px-4 py-2 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Servidor Online
                     </span>
                     <button onClick={fetchVpsData} className="p-2 text-slate-400 hover:text-purple-500 transition-all"><RefreshCw size={20} /></button>
                  </div>
              </div>

              {vpsData && (
                 <>
                  {/* METRICS CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-white p-8 rounded-none border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                           <div className="w-12 h-12 bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100"><Cpu size={24}/></div>
                           <span className={`text-xl font-black ${Number(vpsData.vps.cpu.usage) > 80 ? 'text-red-500' : 'text-slate-900'}`}>{vpsData.vps.cpu.usage}%</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400  tracking-widest mb-1">Uso de Processamento</p>
                        <h4 className="text-sm font-bold text-slate-600 truncate">{vpsData.vps.cpu.model}</h4>
                        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-1000 ${Number(vpsData.vps.cpu.usage) > 80 ? 'bg-red-500' : 'bg-purple-500'}`} style={{width: `${vpsData.vps.cpu.usage}%`}} />
                        </div>
                     </div>

                     <div className="bg-white p-8 rounded-none border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                           <div className="w-12 h-12 bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100"><Activity size={24}/></div>
                           <span className={`text-xl font-black ${Number(vpsData.vps.memory.usage) > 85 ? 'text-red-500' : 'text-slate-900'}`}>{vpsData.vps.memory.usage}%</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400  tracking-widest mb-1">Memória RAM (Usada / Total)</p>
                        <h4 className="text-sm font-bold text-slate-600">{vpsData.vps.memory.used} / {vpsData.vps.memory.total}</h4>
                        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-1000 ${Number(vpsData.vps.memory.usage) > 85 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${vpsData.vps.memory.usage}%`}} />
                        </div>
                     </div>

                     <div className="bg-white p-8 rounded-none border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                           <div className="w-12 h-12 bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100"><HardDrive size={24}/></div>
                           <span className="text-xl font-black text-slate-900">{vpsData.vps.disk.usage}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400  tracking-widest mb-1">Espaço em Disco Ocupado</p>
                        <h4 className="text-sm font-bold text-slate-600">Partição Raiz (/)</h4>
                        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div className="h-full bg-green-500 transition-all duration-1000" style={{width: vpsData.vps.disk.usage}} />
                        </div>
                     </div>
                  </div>

                  {/* TRAFFIC CHART */}
                  <div className="bg-white p-8 rounded-none border border-slate-100 shadow-sm">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <h3 className="text-lg font-black text-slate-900  tracking-tight">Monitoramento de Tráfego</h3>
                           <p className="text-[10px] font-black text-slate-400  tracking-widest mt-1">Velocidade de Rede (KB/s)</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-none" />
                              <span className="text-[10px] font-bold text-slate-500 ">Entrada (IN)</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-purple-500 rounded-none" />
                              <span className="text-[10px] font-bold text-slate-500 ">Saída (OUT)</span>
                           </div>
                        </div>
                     </div>
                     <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={trafficHistory}>
                              <defs>
                                 <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                 </linearGradient>
                                 <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                              <Tooltip contentStyle={{borderRadius: 0, fontWeight: 'bold', fontSize: '11px', border: '1px solid #f1f5f9'}} />
                              <Area type="monotone" dataKey="in" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" name="Entrada" animationDuration={500} />
                              <Area type="monotone" dataKey="out" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" name="Saída" animationDuration={500} />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* TERMINALS */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-[#0f172a] rounded-none shadow-2xl overflow-hidden flex flex-col h-[500px]">
                        <div className="bg-white/5 p-4 border-b border-white/10 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="flex gap-1.5">
                                 <div className="w-3 h-3 rounded-full bg-red-500" />
                                 <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                 <div className="w-3 h-3 rounded-full bg-green-500" />
                              </div>
                              <span className="text-[10px] font-black text-white/40  tracking-widest ml-2 flex items-center gap-2">
                                 <Terminal size={14} /> Console NextJS
                              </span>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-[8px] font-black text-green-500 ">Live</span>
                           </div>
                        </div>
                        <div className="flex-1 p-6 font-mono text-xs text-blue-400 overflow-y-auto whitespace-pre-wrap custom-scrollbar selection:bg-purple-500/30">
                           {vpsData.logs.next || "Aguardando logs do sistema..."}
                           <div className="h-1 w-1 animate-pulse bg-blue-400 inline-block ml-1" />
                        </div>
                     </div>

                     <div className="bg-[#0f172a] rounded-none shadow-2xl overflow-hidden flex flex-col h-[500px]">
                        <div className="bg-white/5 p-4 border-b border-white/10 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="flex gap-1.5">
                                 <div className="w-3 h-3 rounded-full bg-red-500" />
                                 <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                 <div className="w-3 h-3 rounded-full bg-green-500" />
                              </div>
                              <span className="text-[10px] font-black text-white/40  tracking-widest ml-2 flex items-center gap-2">
                                 <Server size={14} /> WebSocket PDV
                              </span>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                              <span className="text-[8px] font-black text-purple-500 ">Connected</span>
                           </div>
                        </div>
                        <div className="flex-1 p-6 font-mono text-xs text-purple-400 overflow-y-auto whitespace-pre-wrap custom-scrollbar selection:bg-purple-500/30">
                           {vpsData.logs.socket || "Aguardando conexão do servidor de sockets..."}
                           <div className="h-1 w-1 animate-pulse bg-purple-400 inline-block ml-1" />
                        </div>
                     </div>
                  </div>

                  <div className="bg-white p-6 border border-slate-100 text-center">
                     <p className="text-[10px] font-black text-slate-400  tracking-widest">
                        Plataforma: <span className="text-slate-900">{vpsData.vps.platform} ({vpsData.vps.arch})</span> | 
                        Uptime: <span className="text-slate-900">{(vpsData.vps.uptime / 3600).toFixed(1)} horas</span>
                     </p>
                  </div>
                 </>
              )}
           </div>
        )}

        {activeTab === "expiration" && (
           <div className="animate-in fade-in duration-300 space-y-10">

              <div className="flex items-center justify-between">
                 <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Relatório de Expiração</h2>
                 <button onClick={fetchExpiration} className="p-3 text-slate-400 hover:text-purple-500 transition-all"><RefreshCw size={24}/></button>
              </div>

              <div className="bg-white border border-slate-100 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black  text-slate-400">
                       <tr>
                          <th className="p-6">Loja</th>
                          <th className="p-6">Vencimento</th>
                          <th className="p-6">Dias Restantes</th>
                          <th className="p-6">WhatsApp</th>
                          <th className="p-6 text-right">Ação</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {expiringSoon.map(item => {
                          const daysLeft = Math.ceil((new Date(item.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          return (
                             <tr key={item.id} className="text-xs font-bold hover:bg-slate-50 transition-all">
                                <td className="p-6  text-slate-900">{item.store.name}</td>
                                <td className="p-6 text-red-500">{format(new Date(item.expiresAt), 'dd/MM/yyyy')}</td>
                                <td className="p-6">
                                   <span className={`px-2 py-1 rounded-full text-[9px] font-black  ${daysLeft <= 2 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                      {daysLeft} Dias
                                   </span>
                                </td>
                                <td className="p-6 text-slate-400">{item.store.whatsapp}</td>
                                <td className="p-6 text-right">
                                   <a 
                                     href={`https://wa.me/55${item.store.whatsapp.replace(/\D/g, '')}?text=Olá ${item.store.name}, sua assinatura vence em breve.`}
                                     target="_blank"
                                     className="bg-green-500 text-white px-4 py-2 font-black  text-[9px] tracking-widest hover:brightness-110 transition-all"
                                   >Notificar</a>
                                </td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === "webhooks" && (
           <div className="animate-in fade-in duration-300 space-y-10">
              <div className="flex items-center justify-between">
                 <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Auditoria de Webhooks</h2>
                 <button onClick={fetchWebhooks} className="p-3 text-slate-400 hover:text-purple-500 transition-all"><RefreshCw size={24}/></button>
              </div>

              <div className="bg-white border border-slate-100 shadow-sm overflow-hidden text-nowrap overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black  text-slate-400">
                       <tr>
                          <th className="p-6">Provedor</th>
                          <th className="p-6">Evento</th>
                          <th className="p-6">Status</th>
                          <th className="p-6">Data/Hora</th>
                          <th className="p-6">Payload</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {webhookLogs.map(log => (
                          <tr key={log.id} className="text-xs font-bold hover:bg-slate-50 transition-all">
                             <td className="p-6">
                                <span className="bg-slate-100 px-2 py-1  text-[9px] font-black">{log.provider}</span>
                             </td>
                             <td className="p-6  text-slate-900">{log.event}</td>
                             <td className="p-6">
                                <span className={log.status >= 400 ? 'text-red-500' : 'text-green-500'}>{log.status}</span>
                             </td>
                             <td className="p-6 text-slate-400">{format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}</td>
                             <td className="p-6 font-mono text-[9px] text-slate-400 max-w-[200px] truncate">{log.payload}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}


        {activeTab === "analytics" && analyticsData && (
           <div className="animate-in fade-in duration-300 space-y-10">
              <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Analytics Pro</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="bg-white p-10 border border-slate-100 shadow-sm border-t-8 border-t-blue-500">
                    <p className="text-[10px] font-black text-slate-400  tracking-widest mb-2">LTV Médio</p>
                    <h3 className="text-4xl font-black text-slate-900">R$ {analyticsData.ltv}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-4 ">Valor acumulado por lojista</p>
                 </div>
                 <div className="bg-white p-10 border border-slate-100 shadow-sm border-t-8 border-t-red-500">
                    <p className="text-[10px] font-black text-slate-400  tracking-widest mb-2">Churn Rate (30d)</p>
                    <h3 className="text-4xl font-black text-slate-900">{analyticsData.churnRate}%</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-4 ">Taxa de cancelamento/expiração</p>
                 </div>
                 <div className="bg-white p-10 border border-slate-100 shadow-sm border-t-8 border-t-purple-500">
                    <p className="text-[10px] font-black text-slate-400  tracking-widest mb-2">Tickets Pendentes</p>
                    <h3 className="text-4xl font-black text-slate-900">{analyticsData.pendingTickets}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-4 ">Aguardando atendimento</p>
                 </div>
              </div>

              <div className="bg-white p-10 border border-slate-100 shadow-sm">
                 <h3 className="text-lg font-black text-slate-900  tracking-tight mb-8">Evolução da Receita (6 Meses)</h3>
                 <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={analyticsData.revenueHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                          <Tooltip contentStyle={{borderRadius: 0, fontWeight: 'bold', border: '1px solid #f1f5f9'}} />
                          <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={4} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>
        )}

        {activeTab === "broadcast" && (
           <div className="animate-in fade-in duration-300 space-y-10">
              <div className="flex items-center justify-between">
                 <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Avisos Globais</h2>
                 <button onClick={() => setIsAddingAnnouncement(true)} className="bg-purple-500 text-white px-8 py-4 rounded-none font-black text-xs  tracking-widest shadow-xl border-none">Novo Comunicado</button>
              </div>

              <div className="bg-white border border-slate-100 shadow-sm divide-y divide-slate-50">
                 {announcements.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 font-bold  text-xs">Nenhum aviso ativo</div>
                 ) : announcements.map(a => (
                    <div key={a.id} className="p-8 flex items-center justify-between">
                       <div>
                          <div className="flex items-center gap-3 mb-2">
                             <span className={`px-2 py-0.5 text-[9px] font-black  rounded ${a.type === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>{a.type}</span>
                             <h4 className="text-lg font-black text-slate-900  tracking-tight">{a.title}</h4>
                          </div>
                          <p className="text-slate-500 text-sm font-medium">{a.content}</p>
                          <p className="text-[10px] text-slate-400 font-bold  mt-2">Postado em: {format(new Date(a.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                       </div>
                       <button onClick={async () => {
                          if (confirm("Remover este aviso?")) {
                             await fetch("/api/superadmin/announcements", { method: "DELETE", body: JSON.stringify({ id: a.id }) });
                             fetchAnnouncements();
                          }
                       }} className="text-red-500 hover:bg-red-50 p-3 rounded-none transition-all"><Trash2 size={20}/></button>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === "support" && (
           <div className="animate-in fade-in duration-300 space-y-10">
              <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Tickets de Suporte</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-1 bg-white border border-slate-100 shadow-sm divide-y divide-slate-50 h-[700px] overflow-y-auto">
                    {tickets.map(t => (
                       <div 
                         key={t.id} 
                         onClick={() => setSelectedTicket(t)}
                         className={`p-6 cursor-pointer hover:bg-slate-50 transition-all border-l-4 ${selectedTicket?.id === t.id ? 'border-purple-500 bg-slate-50' : 'border-transparent'}`}
                       >
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-black text-slate-400 ">#{t.id.slice(-6)}</span>
                             <span className={`px-2 py-0.5 text-[8px] font-black  rounded ${t.status === 'OPEN' ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{t.status}</span>
                          </div>
                          <h4 className="font-black text-slate-900  text-sm truncate">{t.subject}</h4>
                          <p className="text-xs font-bold text-purple-500  mt-1">{t.store?.name || t.user.name}</p>
                       </div>
                    ))}
                 </div>

                 <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm flex flex-col h-[700px]">
                    {selectedTicket ? (
                       <>
                          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                             <div>
                                <h3 className="text-xl font-black text-slate-900  tracking-tight">{selectedTicket.subject}</h3>
                                <p className="text-xs font-bold text-slate-400 ">Cliente: {selectedTicket.user.name} ({selectedTicket.user.email})</p>
                             </div>
                             <select 
                               value={selectedTicket.status} 
                               onChange={async (e) => {
                                  await fetch("/api/superadmin/tickets", { method: "PATCH", body: JSON.stringify({ id: selectedTicket.id, status: e.target.value }) });
                                  fetchTickets();
                               }}
                               className="bg-white border border-slate-200 p-2 text-[10px] font-black  outline-none"
                             >
                                <option value="OPEN">ABERTO</option>
                                <option value="IN_PROGRESS">EM ANDAMENTO</option>
                                <option value="CLOSED">FECHADO</option>
                             </select>
                          </div>
                          <div className="flex-1 p-8 overflow-y-auto space-y-6">
                             {selectedTicket.messages.map((m: any) => (
                                <div key={m.id} className={`flex flex-col ${m.senderId === (selectedTicket.user.id) ? 'items-start' : 'items-end'}`}>
                                   <div className={`max-w-[80%] p-4 rounded-none font-medium text-sm ${m.senderId === (selectedTicket.user.id) ? 'bg-slate-100 text-slate-800' : 'bg-purple-500 text-white'}`}>
                                      {m.content}
                                   </div>
                                   <span className="text-[9px] text-slate-400 font-bold  mt-1">{format(new Date(m.createdAt), 'HH:mm')}</span>
                                </div>
                             ))}
                          </div>
                          <div className="p-6 border-t border-slate-100 flex gap-4">
                             <input 
                               value={ticketReply}
                               onChange={e => setTicketReply(e.target.value)}
                               placeholder="Digite sua resposta..."
                               className="flex-1 border border-slate-200 p-4 font-bold text-sm outline-none focus:border-purple-500"
                             />
                             <button 
                               onClick={async () => {
                                  if (!ticketReply) return;
                                  await fetch("/api/superadmin/tickets", { method: "POST", body: JSON.stringify({ ticketId: selectedTicket.id, content: ticketReply }) });
                                  setTicketReply("");
                                  fetchTickets();
                               }}
                               className="bg-purple-500 text-white px-8 py-4 font-black text-xs  tracking-widest border-none"
                             >Enviar</button>
                          </div>
                       </>
                    ) : (
                       <div className="flex-1 flex items-center justify-center text-slate-300 font-black  text-sm">Selecione um ticket para visualizar</div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {activeTab === "payments" && (
           <div className="animate-in fade-in duration-300 space-y-10">
              <div className="flex items-center justify-between">
                 <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Gestão Financeira (Efí)</h2>
                 <button onClick={fetchPayments} className="p-3 text-slate-400 hover:text-purple-500 transition-all"><RefreshCw size={24}/></button>
              </div>

              <div className="bg-white border border-slate-100 shadow-sm overflow-x-auto">
                 <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black  text-slate-400">
                       <tr>
                          <th className="p-6">Loja</th>
                          <th className="p-6">Valor</th>
                          <th className="p-6">Status</th>
                          <th className="p-6">TxID (Efí)</th>
                          <th className="p-6">Data</th>
                          <th className="p-6 text-right">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {payments.map(p => (
                          <tr key={p.id} className="text-xs font-bold hover:bg-slate-50 transition-all">
                             <td className="p-6  text-slate-900">{p.storeName}</td>
                             <td className="p-6 text-slate-900">R$ {p.amount.toFixed(2)}</td>
                             <td className="p-6">
                                <span className={`px-2 py-1 rounded-full text-[9px] font-black  ${p.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                   {p.status === 'paid' ? 'Pago' : 'Pendente'}
                                </span>
                             </td>
                             <td className="p-6 font-mono text-[10px] text-slate-400 truncate max-w-[150px]">{p.externalId || 'N/A'}</td>
                             <td className="p-6 text-slate-400">{format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                             <td className="p-6 text-right space-x-2">
                                {p.status !== 'paid' && (
                                   <>
                                      <button 
                                        onClick={async () => {
                                           const load = toast.loading("Verificando na Efí...");
                                           const res = await fetch("/api/superadmin/payments", { method: "PATCH", body: JSON.stringify({ id: p.id, action: "check_status" }) });
                                           const data = await res.json();
                                           toast.dismiss(load);
                                           if (data.success) {
                                              toast.success(`Status atualizado: ${data.efiFullStatus}`);
                                              fetchPayments();
                                           } else {
                                              toast.error(data.error || "Erro ao verificar");
                                           }
                                        }}
                                        className="bg-blue-500 text-white px-3 py-1.5 font-black  text-[9px] tracking-widest hover:bg-blue-600 transition-all"
                                      >Checar Efí</button>
                                      <button 
                                        onClick={async () => {
                                           if (confirm("Deseja aprovar este pagamento MANUALMENTE? A assinatura será ativada.")) {
                                              const res = await fetch("/api/superadmin/payments", { method: "PATCH", body: JSON.stringify({ id: p.id, action: "manual_approve" }) });
                                              if (res.ok) {
                                                 toast.success("Aprovado com sucesso!");
                                                 fetchPayments();
                                              }
                                           }
                                        }}
                                        className="bg-slate-900 text-white px-3 py-1.5 font-black  text-[9px] tracking-widest hover:bg-green-600 transition-all"
                                      >Aprovar Manual</button>
                                   </>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === "audit" && (
           <div className="animate-in fade-in duration-300 space-y-10">

              <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Trilha de Auditoria</h2>
              <div className="bg-white border border-slate-100 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black  text-slate-400">
                       <tr>
                          <th className="p-6">Data/Hora</th>
                          <th className="p-6">Ação</th>
                          <th className="p-6">Recurso</th>
                          <th className="p-6">Detalhes</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {auditLogs.map(log => (
                          <tr key={log.id} className="text-xs font-bold hover:bg-slate-50 transition-all">
                             <td className="p-6 text-slate-400">{format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}</td>
                             <td className="p-6  text-slate-900">{log.action}</td>
                             <td className="p-6 text-purple-500 ">{log.resource}</td>
                             <td className="p-6 text-slate-600 truncate max-w-[300px]">{log.details}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === "health" && (
           <div className="animate-in fade-in duration-300 space-y-10">
              <div className="flex items-center justify-between">
                 <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Status do Sistema</h2>
                 <button onClick={fetchHealth} className="p-3 text-slate-400 hover:text-purple-500 transition-all"><RefreshCw size={24}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                    { label: "Banco de Dados", status: healthStatus?.database, icon: Database },
                    { label: "Efí (Pix)", status: healthStatus?.efi, icon: CreditCard },
                    { label: "WhatsApp (Evolution)", status: healthStatus?.whatsapp, icon: Globe },
                    { label: "VPS Node.js", status: "online", icon: Server },
                 ].map((service, i) => (
                    <div key={i} className="bg-white p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center">
                       <div className={`w-16 h-16 rounded-none flex items-center justify-center mb-6 border ${service.status === 'online' ? 'bg-green-50 text-green-500 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                          <service.icon size={32} />
                       </div>
                       <h4 className="text-xs font-black text-slate-900  tracking-widest mb-1">{service.label}</h4>
                       <span className={`text-[10px] font-black  px-3 py-1 rounded-full ${service.status === 'online' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                          {service.status === 'online' ? 'Operacional' : 'Instável / Offline'}
                       </span>
                    </div>
                 ))}
              </div>

              <div className="bg-[#0f172a] p-10 text-white">
                 <div className="flex items-center gap-4 mb-8">
                    <ShieldCheck size={40} className="text-purple-500" />
                    <div>
                       <h3 className="text-xl font-black  tracking-tight">Segurança da Infraestrutura</h3>
                       <p className="text-slate-400 text-xs font-bold ">Monitoramento em Tempo Real</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 bg-white/5 border border-white/10">
                       <p className="text-[10px] font-black text-slate-500  mb-4">Certificado SSL</p>
                       <div className="flex items-center gap-3">
                          <CheckCircle className="text-green-500" size={20} />
                          <span className="text-sm font-bold ">Ativo & Válido</span>
                       </div>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10">
                       <p className="text-[10px] font-black text-slate-500  mb-4">Firewall (UFW)</p>
                       <div className="flex items-center gap-3">
                          <CheckCircle className="text-green-500" size={20} />
                          <span className="text-sm font-bold ">Proteção Ativa</span>
                       </div>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10">
                       <p className="text-[10px] font-black text-slate-500  mb-4">Backup Automático</p>
                       <div className="flex items-center gap-3">
                          <CheckCircle className="text-green-500" size={20} />
                          <span className="text-sm font-bold ">Agendado (03:00)</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
        
        {activeTab === "backups" && (
           <div className="animate-in fade-in duration-300 space-y-10">

              <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900  tracking-tighter">Backups de Segurança</h2>
                    <p className="text-slate-500 font-bold  text-[10px] tracking-widest mt-1">Agendamento Diário: <span className="text-purple-500">03:00 AM (Brasília)</span></p>
                  </div>
                  <button 
                    onClick={handleCreateBackup}
                    className="bg-[#0f172a] text-white px-8 py-4 rounded-none font-black text-xs  tracking-widest shadow-xl hover:bg-purple-500 transition-all flex items-center gap-3 border-none"
                  >
                     <Database size={18} /> Gerar Backup Agora
                  </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2">
                    <div className="bg-white rounded-none border border-slate-100 shadow-sm overflow-hidden">
                       <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                          <span className="font-black  text-xs text-slate-900 flex items-center gap-2"><History size={16}/> Histórico de Backups (Máx 5)</span>
                          <span className="text-[10px] font-black text-slate-400  tracking-widest">{backups.length} Arquivos</span>
                       </div>
                       <div className="divide-y divide-slate-50">
                          {backups.length === 0 ? (
                             <div className="p-20 text-center text-slate-400 font-bold  text-xs tracking-widest">Nenhum backup encontrado</div>
                          ) : backups.map((b) => (
                             <div key={b.name} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all group">
                                <div className="flex items-center gap-6">
                                   <div className="w-12 h-12 bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 group-hover:text-purple-500 group-hover:border-purple-200 transition-all"><Database size={24}/></div>
                                   <div>
                                      <p className="text-slate-900 font-black text-sm ">{b.name}</p>
                                      <p className="text-slate-400 text-[10px] font-bold  tracking-widest mt-1">
                                         Criado em: {format(new Date(b.createdAt), 'dd/MM/yyyy HH:mm:ss')} • Tamanho: {b.size}
                                      </p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                   <button 
                                      onClick={() => handleDownloadBackup(b.name)}
                                      className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-none text-[10px] font-black  tracking-widest hover:bg-slate-200 transition-all border-none flex items-center gap-2"
                                      title="Baixar Backup"
                                   >
                                      <Download size={14} /> Baixar
                                   </button>
                                   <button 
                                      onClick={() => handleRestoreBackup(b.name)}
                                      className="bg-red-50 text-red-600 px-6 py-2.5 rounded-none text-[10px] font-black  tracking-widest hover:bg-red-600 hover:text-white transition-all border-none"
                                   >
                                      Restaurar
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-[#0f172a] p-8 text-white rounded-none border-l-8 border-purple-500 shadow-xl">
                       <ShieldCheck size={40} className="text-purple-500 mb-6" />
                       <h3 className="text-lg font-black  tracking-tight mb-4">Política de Retenção</h3>
                       <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">
                          O sistema mantém automaticamente os últimos 5 backups. Ao gerar o 6º backup, o mais antigo será removido permanentemente para otimizar o espaço em disco.
                       </p>
                       <div className="p-4 bg-white/5 border border-white/10 rounded-none italic-none">
                          <p className="text-[10px] font-black text-slate-500  mb-2">Local de Armazenamento</p>
                          <code className="text-[10px] text-purple-400 font-mono">/app/backups/*.sql</code>
                       </div>
                    </div>

                    <div className="bg-white p-8 rounded-none border border-slate-100 shadow-sm">
                       <h4 className="text-xs font-black text-slate-900  tracking-widest mb-6 border-b border-slate-50 pb-4">Recomendações</h4>
                       <ul className="space-y-4">
                          <li className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 bg-purple-500 mt-1.5 flex-shrink-0" />
                             <p className="text-[10px] font-bold text-slate-600 leading-normal ">Sempre gere um backup manual antes de realizar manutenções críticas.</p>
                          </li>
                          <li className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 bg-purple-500 mt-1.5 flex-shrink-0" />
                             <p className="text-[10px] font-bold text-slate-600 leading-normal ">A restauração irá reiniciar o banco de dados e pode desconectar usuários ativos.</p>
                          </li>
                       </ul>
                    </div>
                 </div>
              </div>
            </div>
         )}

        {/* ABA DE AFILIADOS */}
        {activeTab === "affiliates" && (
          <div className="animate-in fade-in duration-300 space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Gestão de Afiliados</h2>
                <p className="text-slate-400 text-sm font-medium mt-1">Parceiros que indicam lojistas e recebem comissão vitalícia.</p>
              </div>
              <button
                onClick={() => { setAffiliateForm({ name: "", email: "", password: "", pixKey: "", commissionRate: "10" }); setIsAddingAffiliate(true); }}
                className="bg-purple-500 text-white px-8 py-4 rounded-none font-black text-xs tracking-widest shadow-xl border-none hover:brightness-110 transition-all flex items-center gap-3"
              >
                <Plus size={16} /> Cadastrar Afiliado
              </button>
            </div>

            {/* Resumo geral */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Total de Afiliados", value: affiliates.length, color: "border-purple-500" },
                { label: "Afiliados Ativos", value: affiliates.filter((a: any) => a.isActive).length, color: "border-green-500" },
                {
                  label: "Comissões Pendentes (Total)",
                  value: `R$ ${affiliates.reduce((acc: number, a: any) => acc + (a.totalPending ?? 0), 0).toFixed(2)}`,
                  color: "border-amber-500"
                },
              ].map((card) => (
                <div key={card.label} className={`bg-white p-8 rounded-none border border-slate-100 shadow-sm border-l-8 ${card.color}`}>
                  <p className="text-xs font-black text-slate-400 tracking-wider mb-2">{card.label}</p>
                  <h3 className="text-3xl font-black text-slate-900">{card.value}</h3>
                </div>
              ))}
            </div>

            {/* Tabela de afiliados */}
            <div className="bg-white rounded-none border border-slate-100 shadow-sm overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-6">Afiliado</th>
                    <th className="p-6">Chave PIX</th>
                    <th className="p-6">Comissão</th>
                    <th className="p-6">Lojas (Total/Ativas)</th>
                    <th className="p-6">Pendente</th>
                    <th className="p-6">Total Recebido</th>
                    <th className="p-6 text-center">Status</th>
                    <th className="p-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {affiliates.length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-slate-300 font-black text-sm tracking-widest">Nenhum afiliado cadastrado ainda</td></tr>
                  ) : affiliates.map((aff: any) => (
                    <tr key={aff.id} className="hover:bg-slate-50 transition-all font-bold text-sm">
                      <td className="p-6">
                        <p className="text-slate-900">{aff.name}</p>
                        <p className="text-slate-400 text-xs font-medium">{aff.email}</p>
                      </td>
                      <td className="p-6">
                        <span className="font-mono text-xs text-slate-600">{aff.pixKey || "—"}</span>
                      </td>
                      <td className="p-6">
                        <span className="bg-purple-50 text-purple-700 px-3 py-1 text-xs font-black border border-purple-200">
                          {(aff.commissionRate * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-6 text-slate-700">{aff.totalStores} / {aff.activeStores} ativas</td>
                      <td className="p-6 text-amber-600 font-black">R$ {(aff.totalPending ?? 0).toFixed(2)}</td>
                      <td className="p-6 text-green-600 font-black">R$ {(aff.totalPaid ?? 0).toFixed(2)}</td>
                      <td className="p-6 text-center">
                        <span className={`px-3 py-1 text-[9px] font-black border ${
                          aff.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {aff.isActive ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <button
                          onClick={() => handleToggleAffiliate(aff.id, aff.isActive)}
                          className={`px-4 py-2 text-[10px] font-black tracking-widest border-none transition-all ${
                            aff.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                              : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'
                          }`}
                        >
                          {aff.isActive ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* MODAL CADASTRO DE AFILIADO */}
      {isAddingAffiliate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-none p-12 relative shadow-2xl border-t-[12px] border-purple-500">
            <button onClick={() => setIsAddingAffiliate(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 border-none outline-none"><X size={28}/></button>
            <h3 className="text-3xl font-black text-slate-900 text-center mb-10 tracking-tighter">Cadastrar Afiliado</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400">Nome Completo</p>
                <input className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-purple-500" placeholder="NOME DO AFILIADO" value={affiliateForm.name} onChange={e => setAffiliateForm({...affiliateForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400">Email de Acesso</p>
                <input type="email" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-purple-500" placeholder="email@exemplo.com" value={affiliateForm.email} onChange={e => setAffiliateForm({...affiliateForm, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400">Senha de Acesso</p>
                <input type="password" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-purple-500" placeholder="Mínimo 8 caracteres" value={affiliateForm.password} onChange={e => setAffiliateForm({...affiliateForm, password: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400">Chave PIX (para repasses)</p>
                  <input className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-purple-500" placeholder="CPF, email, celular..." value={affiliateForm.pixKey} onChange={e => setAffiliateForm({...affiliateForm, pixKey: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400">Comissão (%)</p>
                  <input type="number" min="1" max="100" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-purple-500" placeholder="10" value={affiliateForm.commissionRate} onChange={e => setAffiliateForm({...affiliateForm, commissionRate: e.target.value})} />
                </div>
              </div>
              <button onClick={handleSaveAffiliate} className="w-full bg-purple-500 text-white py-6 rounded-none font-black text-xs tracking-widest shadow-2xl hover:bg-[#0f172a] transition-all border-none">
                Cadastrar Afiliado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GESTÃO DE LOJA */}
      {isManagingStore && selectedStore && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm italic-none">
              <div className="bg-white w-full max-w-2xl rounded-none p-10 relative shadow-2xl italic-none animate-in zoom-in-95 duration-200">
                 <button onClick={() => setIsManagingStore(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 border-none outline-none italic-none"><X size={28}/></button>
                 <div className="flex items-center gap-8 mb-10 pb-8 border-b border-slate-100 italic-none">
                    <div className="w-20 h-20 bg-slate-100 rounded-none flex items-center justify-center font-black text-slate-400 italic-none text-3xl ">{selectedStore.name.charAt(0)}</div>
                    <div className="italic-none">
                        <h3 className="text-3xl font-black text-slate-900  italic-none tracking-tighter">{selectedStore.name}</h3>
                        <p className="text-sm font-bold text-purple-500 italic-none">Lojista Parceiro</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10 italic-none">
                    <div className="space-y-8 italic-none">
                        <div className="space-y-2 italic-none">
                           <p className="text-xs font-black text-slate-400  italic-none">Definir Plano SaaS</p>
                           <select className="w-full bg-slate-50 border border-slate-200 p-5 rounded-none font-bold text-sm  outline-none italic-none" value={selectedStore.subscription?.plan?.id || ""} onChange={(e) => handleChangePlan(e.target.value)}>
                              <option value="">SELECIONAR PLANO</option>
                              {plans.map(p => ( <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option> ))}
                           </select>
                        </div>
                        <div className="space-y-2 italic-none">
                           <p className="text-xs font-black text-slate-400  italic-none">Validade de Acesso</p>
                           <div className="p-5 bg-[#0f172a] text-white rounded-none italic-none font-black text-lg text-center">
                              {selectedStore.subscription ? format(new Date(selectedStore.subscription.expiresAt), 'dd/MM/yyyy') : 'EXPIRADO'}
                           </div>
                           <button onClick={() => setIsAddingDays(true)} className="w-full py-4 border-4 border-slate-100 text-slate-400 rounded-none font-black text-xs  hover:bg-slate-50 transition-all italic-none mt-2">Alterar Dias de Acesso</button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 italic-none">
                        <p className="text-xs font-black text-slate-400  italic-none">Acesso e Visualização</p>
                        <button onClick={() => window.open(`/api/superadmin/impersonate?storeId=${selectedStore.id}`, '_blank')} className="w-full flex items-center justify-between p-6 bg-purple-500 text-white rounded-none font-black text-xs  shadow-xl hover:brightness-110 transition-all italic-none border-none">
                           <span className="flex items-center gap-3"><ExternalLink size={20}/> Entrar no Painel</span>
                           <ChevronRight size={20} />
                        </button>
                        <button onClick={() => window.open(`/${selectedStore.slug}`, '_blank')} className="w-full py-5 bg-slate-900 text-white rounded-none font-black text-xs  hover:bg-[#0f172a] transition-all italic-none border-none">Ver Cardápio Público</button>
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
               <h3 className="text-3xl font-black text-slate-900  text-center mb-10 italic-none tracking-tighter">Lançar Despesa</h3>
               <div className="space-y-8 italic-none">
                  <div className="space-y-2 italic-none">
                     <p className="text-xs font-black text-slate-400  italic-none">Descrição da Saída</p>
                     <input className="w-full border-2 border-slate-100 p-5 rounded-none font-bold text-sm  outline-none focus:border-red-500 italic-none bg-slate-50" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="grid grid-cols-2 gap-6 italic-none">
                     <div className="space-y-2 italic-none">
                        <p className="text-xs font-black text-slate-400  italic-none">Valor (R$)</p>
                        <input className="w-full border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-red-500 italic-none bg-slate-50" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                     </div>
                     <div className="space-y-2 italic-none">
                        <p className="text-xs font-black text-slate-400  italic-none">Categoria</p>
                        <select className="w-full border-2 border-slate-100 p-5 rounded-none font-bold text-xs  bg-slate-50 italic-none outline-none" value={expenseForm.type} onChange={e => setExpenseForm({...expenseForm, type: e.target.value})}>
                           <option value="FIXED">FIXO</option>
                           <option value="VARIABLE">VARIÁVEL</option>
                           <option value="WITHDRAWAL">SANGRIA</option>
                        </select>
                     </div>
                  </div>
                  <input type="date" className="w-full border-2 border-slate-100 p-5 rounded-none font-bold text-sm italic-none bg-slate-50 outline-none" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
                  <button onClick={handleSaveExpense} className="w-full bg-red-600 text-white py-6 rounded-none font-black  text-xs tracking-widest shadow-2xl hover:bg-slate-900 transition-all border-none italic-none">Efetivar Lançamento</button>
               </div>
            </div>
         </div>
      )}

       {isEditingUser && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-none p-12 relative shadow-2xl border-t-[12px] border-purple-500">
               <button onClick={() => setIsEditingUser(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 border-none outline-none"><X size={28}/></button>
               <h3 className="text-3xl font-black text-slate-900  text-center mb-10 tracking-tighter">{selectedUser ? 'Ajustar Conta' : 'Nova Conta'}</h3>
               <div className="space-y-8">
                  <div className="space-y-2">
                     <p className="text-xs font-black text-slate-400 ">Nome Completo</p>
                     <input className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm  outline-none focus:border-purple-500" placeholder="NOME DO USUÁRIO" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                     <p className="text-xs font-black text-slate-400 ">Email de Acesso</p>
                     <input className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-purple-500" placeholder="EMAIL@EXEMPLO.COM" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <p className="text-xs font-black text-slate-400 ">{selectedUser ? 'Nova Senha (deixe vazio para não alterar)' : 'Senha de Acesso'}</p>
                     <input type="password" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-purple-500" placeholder="******" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <p className="text-xs font-black text-slate-400 ">Nível de Permissão</p>
                     <select className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-xs  outline-none focus:border-purple-500" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                        <option value="USER">LOJISTA (USER)</option>
                        <option value="SUPERADMIN">ADMINISTRADOR (SUPERADMIN)</option>
                     </select>
                  </div>
                  <button onClick={handleSaveUser} className="w-full bg-purple-500 text-white py-6 rounded-none font-black  text-xs tracking-widest shadow-2xl hover:bg-[#0f172a] transition-all border-none">Salvar Alterações</button>
               </div>
            </div>
         </div>
      )}

      {isAddingPlan && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm italic-none">
            <div className="bg-white w-full max-w-2xl rounded-none p-12 relative shadow-2xl border-t-[12px] border-[#0f172a] italic-none">
               <button onClick={() => setIsAddingPlan(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 border-none outline-none"><X size={28}/></button>
               <h3 className="text-3xl font-black text-slate-900 text-center mb-10 tracking-tighter">{editingPlanId ? 'Ajustar Plano' : 'Novo Plano'}</h3>
               <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400">NOME DO PLANO</p>
                        <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-[#0f172a]" placeholder="EX: DIAMANTE" value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value.toUpperCase()})} />
                     </div>
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400">PREÇO MENSAL (R$)</p>
                        <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-[#0f172a]" placeholder="0.00" value={planForm.price} onChange={e => setPlanForm({...planForm, price: e.target.value})} />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-400">LIMITE DE PRODUTOS</p>
                     <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-[#0f172a]" placeholder="100" value={planForm.maxProducts} onChange={e => setPlanForm({...planForm, maxProducts: e.target.value})} />
                  </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-3 space-y-4 mb-4 pb-4 border-b border-slate-50">
                            <p className="text-[10px] font-black text-slate-400">DISPONÍVEL PARA QUAIS MODELOS?</p>
                            <div className="flex gap-4">
                                {[
                                    { id: 'RESTAURANT', label: 'Restaurantes' },
                                    { id: 'SHOWCASE', label: 'Vitrine' },
                                    { id: 'SERVICE', label: 'Serviços' }
                                ].map(type => (
                                    <label key={type.id} className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            className="w-3 h-3 rounded-none border-2 border-slate-200 text-purple-500 focus:ring-0 cursor-pointer"
                                            checked={(planForm.allowedStoreTypes as any).includes(type.id)}
                                            onChange={(e) => {
                                                const current = [...(planForm.allowedStoreTypes as any)];
                                                if (e.target.checked) {
                                                    setPlanForm({ ...planForm, allowedStoreTypes: [...current, type.id] });
                                                } else {
                                                    setPlanForm({ ...planForm, allowedStoreTypes: current.filter(t => t !== type.id) });
                                                }
                                            }}
                                        />
                                        <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900">{type.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        {Object.entries(planForm.features).map(([key, e]) => (
                           <button key={key} type="button" onClick={() => setPlanForm({...planForm, features: {...planForm.features, [key]: !e}})} className={`text-[10px] font-black p-2 border-2 rounded-none transition-all ${e ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-slate-400 border-slate-100'}`}>
                              {featureLabels[key] || key}
                           </button>
                        ))}
                     </div>
                     <button onClick={handleSavePlan} className="w-full bg-[#0f172a] text-white py-6 rounded-none font-black text-xs tracking-widest shadow-2xl hover:bg-purple-500 transition-all border-none">Gravar Configurações</button>
                  </div>
               </div>
            </div>
         )}

      {isAddingDays && selectedStore && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm italic-none">
            <div className="bg-white w-full max-w-md rounded-none p-10 relative shadow-2xl italic-none border-2 border-slate-100">
               <button onClick={() => setIsAddingDays(false)} className="absolute top-6 right-6 text-slate-300 italic-none border-none outline-none"><X size={24}/></button>
               <h4 className="text-lg font-black  text-center mb-8 italic-none tracking-tighter decoration-purple-500 underline decoration-4">Soma de Dias Manuais</h4>
               <input type="number" className="w-full bg-slate-50 p-6 rounded-none text-center text-5xl font-black italic-none outline-none border-2 border-slate-100 focus:bg-white mb-8" placeholder="0" value={daysToAdd} onChange={e => setDaysToAdd(e.target.value)} />
               <button onClick={handleAdjustDays} className="w-full bg-slate-900 text-white py-5 rounded-none font-black  text-xs tracking-widest italic-none border-none shadow-xl">Confirmar Ajuste</button>
            </div>
         </div>
      )}

      {isAddingCity && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm italic-none">
           <div className="bg-white w-full max-w-md rounded-none p-12 relative shadow-2xl border-2 border-slate-100 italic-none">
              <button onClick={() => setIsAddingCity(false)} className="absolute top-8 right-8 text-slate-300 italic-none border-none outline-none"><X size={24}/></button>
              <h3 className="text-xl font-black  tracking-tight mb-10 text-center italic-none">Registrar Cidade de Atendimento</h3>
              <div className="space-y-6 italic-none">
                 <input className="w-full border-2 border-slate-100 p-5 rounded-none font-bold text-sm  outline-none focus:border-purple-500 italic-none bg-slate-50" placeholder="NOME DA CIDADE" value={cityForm.name} onChange={e => setCityForm({...cityForm, name: e.target.value.toUpperCase()})} />
                 <input className="w-full border-2 border-slate-100 p-5 rounded-none font-bold text-sm  outline-none focus:border-purple-500 italic-none bg-slate-50" placeholder="UF (EX: SP)" value={cityForm.state} onChange={e => setCityForm({...cityForm, state: e.target.value.toUpperCase()})} maxLength={2} />
                 <button onClick={handleCreateCity} className="w-full bg-slate-900 text-white py-5 rounded-none font-black  text-xs tracking-widest italic-none shadow-xl border-none">Concluir Cadastro</button>
              </div>
           </div>
         </div>
      )}

      {isAddingAnnouncement && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-none p-12 relative shadow-2xl border-t-[12px] border-purple-500">
               <button onClick={() => setIsAddingAnnouncement(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 border-none outline-none"><X size={28}/></button>
               <h3 className="text-3xl font-black text-slate-900  text-center mb-10 tracking-tighter">Novo Comunicado</h3>
               <div className="space-y-8">
                  <div className="space-y-2">
                     <p className="text-xs font-black text-slate-400 ">Título do Aviso</p>
                     <input id="ann_title" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm  outline-none focus:border-purple-500" placeholder="EX: MANUTENÇÃO PROGRAMADA" />
                  </div>
                  <div className="space-y-2">
                     <p className="text-xs font-black text-slate-400 ">Mensagem</p>
                     <textarea id="ann_content" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-sm outline-none focus:border-purple-500 h-32" placeholder="DESCREVA O AVISO..." />
                  </div>
                  <div className="space-y-2">
                     <p className="text-xs font-black text-slate-400 ">Nível de Alerta</p>
                     <select id="ann_type" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-none font-bold text-xs  outline-none focus:border-purple-500">
                        <option value="INFO">INFORMATIVO (AZUL)</option>
                        <option value="WARNING">ALERTA (AMARELO)</option>
                        <option value="CRITICAL">CRÍTICO (VERMELHO)</option>
                     </select>
                  </div>
                  <button onClick={async () => {
                     const title = (document.getElementById('ann_title') as HTMLInputElement).value;
                     const content = (document.getElementById('ann_content') as HTMLTextAreaElement).value;
                     const type = (document.getElementById('ann_type') as HTMLSelectElement).value;
                     if (!title || !content) return;
                     
                     await fetch("/api/superadmin/announcements", {
                        method: "POST",
                        body: JSON.stringify({ title, content, type })
                     });
                     setIsAddingAnnouncement(false);
                     fetchAnnouncements();
                  }} className="w-full bg-purple-500 text-white py-6 rounded-none font-black  text-xs tracking-widest shadow-2xl hover:bg-[#0f172a] transition-all border-none">Publicar Agora</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

export default function SuperAdminPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" /></div>}>
      <SuperAdminContent />
    </Suspense>
  );
}
