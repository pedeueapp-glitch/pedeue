"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Calendar, ChevronLeft, ChevronRight, Printer,
  ShoppingBag, Loader2, RotateCcw, User, MapPin, Layers,
  Trash2, X, ScrollText, Package, CheckCircle2, Banknote,
  Smartphone, Barcode, LayoutList, Wallet
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_LABELS: any = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  PREPARING: { label: "Em Preparo", color: "bg-blue-100 text-blue-700 border-blue-200" },
  DELIVERING: { label: "Em Rota", color: "bg-purple-100 text-purple-700 border-purple-200" },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-700 border-green-200" },
  DONE: { label: "Concluído", color: "bg-green-100 text-green-700 border-green-200" },
  CANCELED: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
};

const TYPE_LABELS: any = {
  DELIVERY: "Delivery",
  PICKUP: "Retirada",
  DINING_IN: "Mesa",
  RETAIL: "Venda",
  SERVICE: "Serviço",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function escapeHTML(str: string) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function PedidosRelatorioPage() {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [activeTab, setActiveTab] = useState<"orders" | "cashiers">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(tomorrowStr);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [selectedCashier, setSelectedCashier] = useState<any>(null);
  const [cashierDetailReport, setCashierDetailReport] = useState<any>(null);
  const LIMIT = 20;

  const fetchOrders = useCallback(async () => {
    if (activeTab !== "orders") return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        report: "true",
        dateFrom,
        dateTo,
        page: String(page),
        limit: String(LIMIT),
      });
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        setTotalPages(data.pages || 1);
        setTotalOrders(data.total || 0);
      }
    } catch {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, page, activeTab]);

  const fetchCashiers = useCallback(async () => {
    if (activeTab !== "cashiers") return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        history: "true",
        dateFrom,
        dateTo
      });
      const res = await fetch(`/api/pdv/cashier?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCashiers(data);
      }
    } catch {
      toast.error("Erro ao carregar fechamentos");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, activeTab]);

  const handleViewCashier = async (sessionId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pdv/cashier?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.report) {
        setCashierDetailReport(data.report);
        setSelectedCashier(data.session);
      }
    } catch {
      toast.error("Erro ao carregar detalhes do caixa");
    } finally {
      setLoading(false);
    }
  };

  const printCashierReport = (report: any) => {
    const w = window.open("", "_blank");
    if (!w) return;
    
    w.document.write(`
      <html>
        <head>
          <title>Relatório de Fechamento</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { padding: 15px; background: #f9f9f9; border-radius: 8px; border: 1px solid #eee; }
            .card-title { font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin-bottom: 5px; }
            .card-value { font-size: 18px; font-weight: bold; color: #333; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th { text-align: left; background: #eee; padding: 10px; font-size: 12px; }
            .table td { padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; }
            .total-liquido { background: #333 !important; color: #fff !important; }
            .total-liquido .card-value { color: #fff !important; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Fechamento</h1>
            <p>Abertura: ${new Date(report.openedAt).toLocaleString("pt-BR")}</p>
            <p>Fechamento: ${report.closedAt ? new Date(report.closedAt).toLocaleString("pt-BR") : "Aberto"}</p>
          </div>

          <div class="grid">
             <div class="card">
                <div class="card-title">Saldo Inicial</div>
                <div class="card-value">R$ ${report.openingBalance.toFixed(2).replace('.', ',')}</div>
             </div>
             <div class="card">
                <div class="card-title">Vendas Totais</div>
                <div class="card-value">R$ ${report.totalGeral.toFixed(2).replace('.', ',')}</div>
             </div>
          </div>

          <div class="grid">
             <div class="card">
                <div class="card-title">Dinheiro</div>
                <div class="card-value">R$ ${report.totalDinheiro.toFixed(2).replace('.', ',')}</div>
             </div>
             <div class="card">
                <div class="card-title">Cartão</div>
                <div class="card-value">R$ ${report.totalCartao.toFixed(2).replace('.', ',')}</div>
             </div>
             <div class="card">
                <div class="card-title">Pix</div>
                <div class="card-value">R$ ${report.totalPix.toFixed(2).replace('.', ',')}</div>
             </div>
             <div class="card">
                <div class="card-title">Descontos Aplicados</div>
                <div class="card-value">R$ ${report.totalDiscounts.toFixed(2).replace('.', ',')}</div>
             </div>
          </div>

          <div class="grid">
             <div class="card">
                <div class="card-title">Total de Taxas de Entrega</div>
                <div class="card-value">R$ ${report.totalDeliveryFees.toFixed(2).replace('.', ',')}</div>
             </div>
             <div class="card">
                <div class="card-title">Total de Despesas (Sangrias)</div>
                <div class="card-value">R$ ${report.totalWithdrawals.toFixed(2).replace('.', ',')}</div>
             </div>
          </div>

          <div class="card total-liquido" style="margin-top: 20px;">
             <div class="card-title" style="color: #ccc;">Valor Líquido Estimado</div>
             <div class="card-value">R$ ${report.totalLiquido.toFixed(2).replace('.', ',')}</div>
          </div>

          <div class="footer">
            <p>Documento gerado em ${new Date().toLocaleString("pt-BR")}</p>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  useEffect(() => { 
    if (activeTab === "orders") fetchOrders(); 
    else fetchCashiers();
  }, [fetchOrders, fetchCashiers, activeTab]);

  const filteredOrders = orders.filter(o =>
    !search ||
    o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    String(o.orderNumber).includes(search)
  );

  const renderChoicesStr = (choices: any) => {
    if (!choices) return "";
    if (typeof choices === "string") {
      try {
        const parsed = JSON.parse(choices);
        if (Array.isArray(parsed)) return parsed.map((p: any) => p.name).join(", ");
      } catch { return choices; }
    }
    return "";
  };

  // Totais
  const totalGeral = filteredOrders.filter(o => o.status !== "CANCELED").reduce((s, o) => s + (o.total || 0), 0);
  const totalDinheiro = filteredOrders.filter(o => o.paymentMethod?.toLowerCase().includes("dinheiro") && o.status !== "CANCELED").reduce((s, o) => s + (o.total || 0), 0);
  const totalCartao = filteredOrders.filter(o => o.paymentMethod?.toLowerCase().includes("cart") && o.status !== "CANCELED").reduce((s, o) => s + (o.total || 0), 0);
  const totalPix = filteredOrders.filter(o => o.paymentMethod?.toLowerCase().includes("pix") && o.status !== "CANCELED").reduce((s, o) => s + (o.total || 0), 0);

  const printReport = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = filteredOrders.map(o => `
      <tr>
        <td>#${o.orderNumber || o.id.slice(-4).toUpperCase()}</td>
        <td>${new Date(o.createdAt).toLocaleString("pt-BR")}</td>
        <td>${escapeHTML(o.customerName)}</td>
        <td>${TYPE_LABELS[o.orderType] || o.orderType}</td>
        <td>${escapeHTML(o.paymentMethod || "-")}</td>
        <td>${STATUS_LABELS[o.status]?.label || o.status}</td>
        <td align="right">${formatCurrency(o.total)}</td>
      </tr>
    `).join("");
    w.document.write(`<html><head><title>Relatório de Pedidos</title>
      <style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:4px 8px}th{background:#f3f4f6;font-weight:bold}.total{font-size:14px;font-weight:bold;margin-top:10px}</style>
      </head><body>
      <h2>Relatório de Pedidos — ${formatDate(dateFrom)} a ${formatDate(dateTo)}</h2>
      <table><thead><tr><th>#</th><th>Data</th><th>Cliente</th><th>Tipo</th><th>Pagamento</th><th>Status</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="total" style="margin-top:16px">
        Total Geral: ${formatCurrency(totalGeral)} | Dinheiro: ${formatCurrency(totalDinheiro)} | Cartão: ${formatCurrency(totalCartao)} | PIX: ${formatCurrency(totalPix)}
      </div>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 pb-10 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Relatórios do Sistema</h2>
          <p className="text-slate-400 text-sm mt-1">Histórico completo com filtros por data</p>
        </div>
        
        {/* TABS */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-black transition-all ${activeTab === "orders" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <LayoutList size={14} /> Pedidos
          </button>
          <button 
            onClick={() => setActiveTab("cashiers")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-black transition-all ${activeTab === "cashiers" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Wallet size={14} /> Fechamentos
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-black text-slate-400 tracking-widest block mb-2 flex items-center gap-1"><Calendar size={10} /> DE</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-black text-slate-400 tracking-widest block mb-2 flex items-center gap-1"><Calendar size={10} /> ATÉ</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500" />
          </div>
          {activeTab === "orders" && (
            <div className="flex-[2] min-w-[200px]">
              <label className="text-[10px] font-black text-slate-400 tracking-widest block mb-2 flex items-center gap-1"><Search size={10} /> BUSCAR</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Nome ou nº do pedido..."
                  className="w-full pl-9 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500" />
              </div>
            </div>
          )}
          {activeTab === "orders" && (
            <button onClick={printReport}
              className="px-5 py-3 bg-purple-600 text-white rounded-lg font-black text-xs flex items-center gap-2 hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20">
              <Printer size={14} /> Imprimir
            </button>
          )}
        </div>

        {/* Totalizadores (Pedidos) */}
        {activeTab === "orders" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            {[
              { label: "Total Geral", value: totalGeral, color: "purple", bold: true },
              { label: "💵 Dinheiro", value: totalDinheiro, color: "green" },
              { label: "💳 Cartão", value: totalCartao, color: "blue" },
              { label: "📱 PIX", value: totalPix, color: "indigo" },
            ].map(({ label, value, color, bold }) => (
              <div key={label} className={`p-3 bg-${color}-50 border border-${color}-100 rounded-lg shadow-sm`}>
                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{label}</p>
                <p className={`text-xl font-black text-${color}-700 mt-1`}>{formatCurrency(value)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeTab === "orders" ? (
        /* GRID DE PEDIDOS RESPONSIVO */
        <div className="space-y-4">
           {loading ? (
             <div className="p-20 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                <Loader2 className="animate-spin text-purple-600 mb-4" size={40} />
                <p className="text-sm font-black text-slate-400 tracking-widest uppercase">Buscando registros...</p>
             </div>
           ) : filteredOrders.length === 0 ? (
             <div className="p-20 text-center bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center gap-4">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                 <ShoppingBag size={40} />
               </div>
               <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Nenhum pedido encontrado no período</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredOrders.map((order) => {
                  const statusCfg = STATUS_LABELS[order.status] || { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" };
                  return (
                    <div 
                      key={order.id}
                      onClick={() => setDetailOrder(order)}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-purple-500 transition-all cursor-pointer shadow-sm hover:shadow-xl group relative overflow-hidden flex flex-col justify-between h-full"
                    >
                      <div className="absolute top-0 right-0 p-3">
                         <div className={`text-[8px] font-black px-2 py-1 rounded-full border shadow-sm ${statusCfg.color} uppercase tracking-tighter`}>
                           {statusCfg.label}
                         </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                           <span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">#{order.orderNumber || order.id.slice(-4).toUpperCase()}</span>
                           <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                           <span className="text-[10px] font-bold text-slate-400">{formatTime(order.createdAt)}</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1 mb-1">{order.customerName}</h3>
                        <p className="text-[10px] text-slate-400 font-bold">{formatDate(order.createdAt)}</p>
                      </div>

                      <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                        <div>
                           <p className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1">{TYPE_LABELS[order.orderType] || order.orderType}</p>
                           <div className="flex items-center gap-1.5">
                             {order.paymentMethod?.toLowerCase().includes("pix") ? <Smartphone size={10} className="text-purple-400" /> : <Banknote size={10} className="text-slate-400" />}
                             <p className="text-[9px] font-bold text-slate-500 truncate max-w-[80px] uppercase">{order.paymentMethod || "—"}</p>
                           </div>
                        </div>
                        <p className={`text-xl font-black tracking-tighter ${order.status === "CANCELED" ? "text-slate-200 line-through" : "text-slate-900 group-hover:text-purple-700"}`}>
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                    </div>
                  );
                })}
             </div>
           )}

           {/* Paginação */}
           {totalPages > 1 && (
             <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
               <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                 Página <span className="text-slate-900">{page}</span> de {totalPages}
               </p>
               <div className="flex items-center gap-2">
                 <button
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   disabled={page === 1}
                   className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all hover:text-purple-600"
                 >
                   <ChevronLeft size={18} />
                 </button>
                 <button
                   onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                   disabled={page === totalPages}
                   className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all hover:text-purple-600"
                 >
                   <ChevronRight size={18} />
                 </button>
               </div>
             </div>
           )}
        </div>
      ) : (
        /* TABELA DE FECHAMENTOS (FECHAMENTOS DE CAIXA) */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase flex items-center gap-2">
              <Wallet size={14} className="text-purple-500" /> {loading ? "Carregando..." : `${cashiers.length} fechamentos encontrados`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  {["Abertura", "Fechamento", "Status", "Saldo Inicial", "Saldo Final", "Conferência"].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[9px] font-black text-slate-400 tracking-widest uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cashiers.map((session) => (
                  <tr 
                    key={session.id} 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => handleViewCashier(session.id)}
                  >
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-700">{formatDate(session.openedAt)}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{formatTime(session.openedAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {session.closedAt ? (
                        <>
                          <p className="text-xs font-black text-slate-700">{formatDate(session.closedAt)}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{formatTime(session.closedAt)}</p>
                        </>
                      ) : <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">Aberto</span>}
                    </td>
                    <td className="px-6 py-4">
                       <div className={`w-3 h-3 rounded-full ${session.status === 'OPEN' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-300'}`}></div>
                    </td>
                    <td className="px-6 py-4 font-black text-xs text-slate-700">{formatCurrency(session.openingBalance || 0)}</td>
                    <td className="px-6 py-4 font-black text-xs text-slate-900 line-clamp-1 max-w-[200px]">{session.closingNotes ? session.closingNotes : "—"}</td>
                    <td className="px-6 py-4">
                      {session.closedAt ? (
                        <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg uppercase">Conferido</span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES DO PEDIDO */}
      {detailOrder && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh] animate-in fade-in zoom-in-95 duration-300 relative border-8 border-white">
            <button
              onClick={() => setDetailOrder(null)}
              className="absolute top-6 right-6 z-50 p-3 bg-slate-100 hover:bg-white text-slate-400 hover:text-slate-900 rounded-2xl transition-all border border-slate-200/50 shadow-sm"
            >
              <X size={20} />
            </button>

            {/* RECIBO ESQUERDA */}
            <div className="lg:w-1/2 bg-slate-50 flex flex-col border-b lg:border-b-0 lg:border-r border-dashed border-slate-200 relative">
               <div className="p-8 text-center border-b border-dashed border-slate-200">
                  <h3 className="font-black text-slate-900 text-xl tracking-tight mb-1">Itens do Pedido</h3>
                  <p className="text-[10px] text-purple-500 font-black uppercase tracking-[0.2em]">
                    #{detailOrder.orderNumber || detailOrder.id.slice(-4).toUpperCase()} • {formatTime(detailOrder.createdAt)}
                  </p>
               </div>

               <div className="p-8 flex-1 overflow-y-auto space-y-6">
                 {detailOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start gap-4">
                       <div className="flex gap-4">
                          <span className="text-sm font-black text-slate-300">{item.quantity}x</span>
                          <div>
                             <p className={`text-sm font-black text-slate-800 leading-none mb-1.5 ${item.isCanceled ? 'line-through text-slate-400' : ''}`}>
                               {item.productName || item.product?.name}
                             </p>
                             {item.choices && <p className="text-[10px] font-bold text-slate-400 italic leading-tight">+ {renderChoicesStr(item.choices)}</p>}
                             {item.notes && (
                               <div className="mt-2 bg-purple-50 text-[9px] font-black text-purple-600 px-2 py-1 rounded-lg w-fit flex items-center gap-1.5">
                                 <ScrollText size={10} /> {item.notes}
                               </div>
                             )}
                          </div>
                       </div>
                       <span className={`text-sm font-black text-slate-900 ${item.isCanceled ? 'line-through text-slate-200' : ''}`}>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                 ))}
               </div>

               <div className="p-8 bg-white/50 border-t border-dashed border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                     <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                     <span className="text-sm font-black text-slate-600">{formatCurrency(detailOrder.subtotal || detailOrder.total)}</span>
                  </div>
               </div>
            </div>

            {/* INFO DIREITA */}
            <div className="lg:w-1/2 p-10 flex flex-col justify-between bg-white overflow-y-auto">
               <div className="space-y-10">
                  <section>
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Informações do Cliente</h4>
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-center gap-4">
                       <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-purple-500 border border-slate-100 shadow-sm"><User size={24} /></div>
                       <div>
                          <p className="text-base font-black text-slate-900">{detailOrder.customerName}</p>
                          <p className="text-xs font-bold text-slate-400 mt-0.5">{detailOrder.customerPhone || "Telefone não informado"}</p>
                       </div>
                    </div>
                  </section>

                  {detailOrder.street && (
                    <section>
                       <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Endereço de Entrega</h4>
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 border border-slate-100 shrink-0"><MapPin size={20} /></div>
                          <div>
                             <p className="text-sm font-black text-slate-800">{detailOrder.street}, {detailOrder.number}</p>
                             <p className="text-xs font-bold text-slate-400 mt-1">{detailOrder.neighborhood} {detailOrder.city ? `• ${detailOrder.city}` : ''}</p>
                             {detailOrder.reference && <p className="text-[10px] text-purple-400 font-bold italic mt-2">Ref: {detailOrder.reference}</p>}
                          </div>
                       </div>
                    </section>
                  )}

                  <section className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-6 opacity-10"><ShoppingBag size={80} /></div>
                     <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-center text-slate-500">
                           <span className="text-[10px] font-black uppercase tracking-widest">Pagamento: {detailOrder.paymentMethod}</span>
                           <span className="text-[10px] font-black uppercase tracking-widest">{TYPE_LABELS[detailOrder.orderType]}</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Final</p>
                              <div className="flex items-center gap-3">
                                 <h2 className="text-4xl font-black tracking-tighter">{formatCurrency(detailOrder.total)}</h2>
                              </div>
                           </div>
                        </div>
                     </div>
                  </section>
               </div>

               <div className="mt-10">
                  <button onClick={() => setDetailOrder(null)} className="w-full py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest transition-all">Voltar ao Relatório</button>
               </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: DETALHES DO FECHAMENTO */}
      {selectedCashier && cashierDetailReport && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border-8 border-white">
            <div className="p-8 border-b border-dashed border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight mb-1">Resumo do Turno</h3>
                  <p className="text-[10px] text-purple-500 font-black uppercase tracking-[0.2em]">
                    Fechamento #{selectedCashier.id.slice(-4).toUpperCase()}
                  </p>
               </div>
               <div className="flex gap-2">
                 <button 
                  onClick={() => printCashierReport(cashierDetailReport)}
                  className="p-3 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl transition-all border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                 >
                    <Printer size={16} /> Imprimir
                 </button>
                 <button
                   onClick={() => { setSelectedCashier(null); setCashierDetailReport(null); }}
                   className="p-3 bg-white hover:bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all border border-slate-200 shadow-sm"
                 >
                   <X size={20} />
                 </button>
               </div>
            </div>

            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Abertura</p>
                     <p className="text-lg font-black text-slate-900">{formatDate(cashierDetailReport.openedAt)} {formatTime(cashierDetailReport.openedAt)}</p>
                     <p className="text-xs font-bold text-slate-400 mt-1">Saldo Inicial: {formatCurrency(cashierDetailReport.openingBalance)}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Fechamento</p>
                     {cashierDetailReport.closedAt ? (
                       <>
                        <p className="text-lg font-black text-slate-900">{formatDate(cashierDetailReport.closedAt)} {formatTime(cashierDetailReport.closedAt)}</p>
                        <p className="text-xs font-bold text-emerald-500 mt-1">Turno Encerrado</p>
                       </>
                     ) : (
                       <p className="text-lg font-black text-emerald-500 animate-pulse">EM ABERTO</p>
                     )}
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-4">
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                     <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-3"><Banknote size={18}/></div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dinheiro</p>
                     <p className="text-base font-black text-slate-900">{formatCurrency(cashierDetailReport.totalDinheiro)}</p>
                  </div>
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                     <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mb-3"><LayoutList size={18}/></div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cartão</p>
                     <p className="text-base font-black text-slate-900">{formatCurrency(cashierDetailReport.totalCartao)}</p>
                  </div>
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                     <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-3"><Smartphone size={18}/></div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PIX</p>
                     <p className="text-base font-black text-slate-900">{formatCurrency(cashierDetailReport.totalPix)}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Movimentações e Taxas</h4>
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 divide-y divide-slate-200/50">
                     <div className="flex justify-between py-3">
                        <span className="text-xs font-bold text-slate-500">Taxas de Entrega</span>
                        <span className="text-xs font-black text-red-500">-{formatCurrency(cashierDetailReport.totalDeliveryFees)}</span>
                     </div>
                     <div className="flex justify-between py-3">
                        <span className="text-xs font-bold text-slate-500">Despesas (Sangrias)</span>
                        <span className="text-xs font-black text-red-500">-{formatCurrency(cashierDetailReport.totalWithdrawals)}</span>
                     </div>
                     <div className="flex justify-between py-3">
                        <span className="text-xs font-bold text-slate-500">Descontos Totais</span>
                        <span className="text-xs font-black text-slate-400">{formatCurrency(cashierDetailReport.totalDiscounts)}</span>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex justify-between items-center shadow-2xl">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Líquido Estimado</p>
                    <p className="text-3xl font-black">{formatCurrency(cashierDetailReport.totalLiquido)}</p>
                  </div>
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Wallet size={32} className="text-emerald-400" />
                  </div>
               </div>

               {selectedCashier.closingNotes && (
                 <div className="p-6 bg-yellow-50 rounded-3xl border border-yellow-100">
                    <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest mb-2 flex items-center gap-2"><ScrollText size={14}/> Notas de Fechamento</p>
                    <p className="text-sm font-medium text-yellow-800 italic">"{selectedCashier.closingNotes}"</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
