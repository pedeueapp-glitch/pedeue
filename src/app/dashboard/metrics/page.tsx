"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Calendar as CalendarIcon, 
  CreditCard, 
  Wallet,
  ArrowUpRight,
  Loader2,
  RefreshCcw,
  BarChart3,
  PieChart as PieIcon
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Header } from "@/components/Header";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";

export default function MetricsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });

  const [data, setData] = useState<any>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/metrics?startDate=${dateRange.start}&endDate=${dateRange.end}`);
      const result = await res.json();
      if (!res.ok) throw new Error();
      setData(result);
    } catch {
      toast.error("Erro ao carregar métricas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const stats = [
    { 
      label: "Vaturamento Total", 
      value: `R$ ${data?.summary.totalVendido.toFixed(2) || "0.00"}`, 
      icon: DollarSign, 
      color: "bg-purple-500",
      description: "Líquido faturado no período"
    },
    { 
      label: "Pedidos Entregues", 
      value: data?.summary.totalPedidos || "0", 
      icon: ShoppingBag, 
      color: "bg-navy",
      description: "Volume total de vendas"
    },
    { 
      label: "Ticket Médio", 
      value: `R$ ${(data?.summary.totalVendido / (data?.summary.totalPedidos || 1)).toFixed(2) || "0.00"}`, 
      icon: TrendingUp, 
      color: "bg-emerald-500",
      description: "Valor médio por pedido"
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
      <Header title="Métricas & Performance" />

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-10">
        
        {/* Filtro de Data */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-navy shadow-inner">
                 <CalendarIcon size={20} />
              </div>
              <div>
                 <h2 className="text-lg font-bold text-slate-800 tracking-tight">Período do Relatório</h2>
                 <p className="text-[10px] text-slate-400 font-bold  tracking-widest">{format(new Date(dateRange.start), "dd 'de' MMMM", { locale: ptBR })} - {format(new Date(dateRange.end), "dd 'de' MMMM", { locale: ptBR })}</p>
              </div>
           </div>

           <div className="flex items-center gap-3 w-full md:w-auto">
              <input 
                type="date" 
                className="input-field !py-2.5 !text-xs !rounded-2xl" 
                value={dateRange.start} 
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} 
              />
              <span className="text-slate-300 font-bold">até</span>
              <input 
                type="date" 
                className="input-field !py-2.5 !text-xs !rounded-2xl" 
                value={dateRange.end} 
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} 
              />
              <button 
                onClick={fetchMetrics}
                className="p-3 bg-navy text-white rounded-2xl hover:bg-purple-500 transition-all shadow-lg shadow-navy/10"
              >
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
              </button>
           </div>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400">
             <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
             <p className="text-xs font-black  tracking-[0.3em]">Gerando Insights...</p>
          </div>
        ) : (
          <>
            {/* Cards de Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color} opacity-[0.03] -mr-8 -mt-8 rounded-full`} />
                  <div className="flex justify-between items-start mb-6">
                    <div className={`${stat.color} p-4 rounded-3xl text-white shadow-lg`}>
                       <stat.icon size={24} />
                    </div>
                    <div className="text-[10px] font-black  tracking-widest text-emerald-500 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full">
                       <ArrowUpRight size={12} /> Live
                    </div>
                  </div>
                  <h3 className="text-[10px] font-black text-slate-400  tracking-[0.2em] mb-1">{stat.label}</h3>
                  <p className="text-3xl font-black text-navy">{stat.value}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-3">{stat.description}</p>
                </div>
              ))}
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Vendas Diárias */}
              <div className="lg:col-span-2 bg-white p-8 lg:p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                       <BarChart3 size={18} />
                    </div>
                    <h4 className="font-bold text-slate-800">Faturamento Diário</h4>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400  tracking-widest">R$/Dia</div>
                </div>

                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.charts.daily}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                        tickFormatter={(val: string) => {
                          try {
                            return format(new Date(val), "dd/MM");
                          } catch {
                            return val;
                          }
                        }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                        tickFormatter={(val) => `R$${val}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Métodos de Pagamento */}
              <div className="bg-white p-8 lg:p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col space-y-8">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-navy/5 text-navy rounded-xl">
                       <PieIcon size={18} />
                    </div>
                    <h4 className="font-bold text-slate-800">Mix de Pagamentos</h4>
                  </div>

                  <div className="flex-1 h-[250px] min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.charts.methods}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {data?.charts.methods.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-50">
                     {data?.charts.methods.map((method: any, i: number) => (
                       <div key={i} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: method.fill }} />
                             <span className="text-xs font-bold text-slate-600  tracking-widest">{method.name}</span>
                          </div>
                          <span className="text-xs font-black text-navy  tracking-widest">
                            R$ {method.value.toFixed(2)}
                          </span>
                       </div>
                     ))}
                  </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
