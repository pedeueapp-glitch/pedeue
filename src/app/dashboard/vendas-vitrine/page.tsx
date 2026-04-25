"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardList, Calendar, DollarSign, TrendingUp, Package, 
  Receipt, Loader2, ChevronDown, User, CreditCard, Search, X
} from "lucide-react";
import { Header } from "@/components/Header";

export default function RetailSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"today" | "all">("all");
  const [totals, setTotals] = useState({ totalRevenue: 0, totalSales: 0, totalItems: 0 });
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSales();
  }, [filter]);

  async function fetchSales() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pdv/retail/sales?filter=${filter}`);
      const data = await res.json();
      if (res.ok) {
        setSales(data.sales || []);
        setTotals({
          totalRevenue: data.totalRevenue || 0,
          totalSales: data.totalSales || 0,
          totalItems: data.totalItems || 0
        });
      }
    } catch {
      console.error("Erro ao carregar vendas");
    } finally {
      setLoading(false);
    }
  }

  const filteredSales = sales.filter(s => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (s.customerName || "").toLowerCase().includes(q) ||
      (s.customerPhone || "").toLowerCase().includes(q) ||
      s.items?.some((i: any) => i.product?.name?.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Header title="Vendas da Vitrine" />

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">

        {/* Filtros e Busca */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setFilter("today")}
              className={`px-5 py-3 font-black  text-[10px] tracking-widest border-2 transition-all rounded-none flex items-center gap-2 ${filter === "today" ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}
            >
              <Calendar size={14} /> Hoje
            </button>
            <button 
              onClick={() => setFilter("all")}
              className={`px-5 py-3 font-black  text-[10px] tracking-widest border-2 transition-all rounded-none flex items-center gap-2 ${filter === "all" ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}
            >
              <TrendingUp size={14} /> Todas
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou produto..."
              className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 font-bold text-xs  outline-none focus:border-purple-500 rounded-none transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Cards de Totais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-50 border border-green-100 flex items-center justify-center">
                <DollarSign size={18} className="text-green-600" />
              </div>
              <p className="text-[9px] font-black  text-slate-400 tracking-widest">Faturamento Total</p>
            </div>
            <p className="text-2xl font-black text-green-700">R$ {totals.totalRevenue.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="p-6 bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Receipt size={18} className="text-blue-600" />
              </div>
              <p className="text-[9px] font-black  text-slate-400 tracking-widest">Total de Vendas</p>
            </div>
            <p className="text-2xl font-black text-blue-700">{totals.totalSales}</p>
          </div>
          <div className="p-6 bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-50 border border-purple-100 flex items-center justify-center">
                <Package size={18} className="text-purple-600" />
              </div>
              <p className="text-[9px] font-black  text-slate-400 tracking-widest">Itens Vendidos</p>
            </div>
            <p className="text-2xl font-black text-purple-700">{totals.totalItems}</p>
          </div>
        </div>

        {/* Tabela de Vendas */}
        <div className="bg-white border border-slate-100 shadow-sm">
          {/* Header da tabela */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <ClipboardList size={18} className="text-purple-500" />
            <h3 className="font-black  text-sm text-slate-800 tracking-tight">
              {filter === "today" ? "Vendas de Hoje" : "Todas as Vendas"} ({filteredSales.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-purple-500 mb-4" />
              <p className="text-xs font-black  text-slate-400 tracking-widest">Carregando...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <Receipt size={48} className="mb-4 opacity-50" />
              <p className="font-black  text-xs tracking-widest">Nenhuma venda encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredSales.map((sale) => (
                <div key={sale.id}>
                  <div 
                    onClick={() => setSelectedSale(selectedSale?.id === sale.id ? null : sale)}
                    className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-all"
                  >
                    {/* Icone */}
                    <div className="w-10 h-10 bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                      <DollarSign size={16} className="text-purple-500" />
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-800 text-xs ">{sale.customerName || "Venda Balcao"}</h4>
                        <span className="bg-green-100 text-green-700 text-[8px] font-black px-2 py-0.5  tracking-widest">{sale.status}</span>
                        <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5  tracking-widest">{sale.paymentMethod}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <p className="text-[10px] text-slate-400 font-bold">
                          {new Date(sale.createdAt).toLocaleDateString('pt-BR')} as {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {sale.customerPhone && (
                          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <User size={10} /> {sale.customerPhone}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 font-bold">{sale.items?.length || 0} ite{(sale.items?.length || 0) === 1 ? 'm' : 'ns'}</p>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <p className="font-black text-purple-600 text-lg">R$ {sale.total.toFixed(2).replace('.', ',')}</p>
                      <ChevronDown size={16} className={`text-slate-300 transition-transform duration-200 ${selectedSale?.id === sale.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Detalhes expandidos */}
                  {selectedSale?.id === sale.id && (
                    <div className="px-5 pb-5 bg-slate-50/50 border-t border-slate-100">
                      <p className="text-[9px] font-black  text-slate-400 tracking-widest mt-4 mb-3">
                        Itens desta venda ({sale.items?.length || 0})
                      </p>
                      <div className="space-y-2">
                        {sale.items?.map((item: any) => (
                          <div key={item.id} className="bg-white p-4 border border-slate-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                              <Package size={16} className="text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-800 text-xs  line-clamp-1">{item.product?.name || "Produto"}</p>
                              {item.choices && item.choices !== '[""]' && (
                                <p className="text-[9px] text-slate-400 font-bold  mt-0.5">
                                  {(() => { try { const c = JSON.parse(item.choices); return Array.isArray(c) ? c.filter(Boolean).join(', ') : item.choices; } catch { return item.choices; } })()}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] font-black text-slate-500">{item.quantity}x R$ {item.price.toFixed(2).replace('.', ',')}</p>
                              <p className="font-black text-purple-600 text-sm">R$ {(item.quantity * item.price).toFixed(2).replace('.', ',')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
