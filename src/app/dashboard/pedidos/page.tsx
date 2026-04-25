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

export default function PedidosRelatorioPage() {
  const today = new Date().toISOString().split("T")[0];
  const [activeTab, setActiveTab] = useState<"orders" | "cashiers">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [detailOrder, setDetailOrder] = useState<any>(null);
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
        <td>${o.customerName}</td>
        <td>${TYPE_LABELS[o.orderType] || o.orderType}</td>
        <td>${o.paymentMethod || "-"}</td>
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
              <div key={label} className={`p-3 bg-${color}-50 border border-${color}-100 rounded-lg`}>
                <p className="text-[10px] font-black text-slate-400 tracking-widest">{label}</p>
                <p className={`text-lg font-black text-${color}-700 mt-1`}>{formatCurrency(value)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeTab === "orders" ? (
        /* TABELA DE PEDIDOS */
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-black text-slate-500 tracking-widest flex items-center gap-2">
              <ShoppingBag size={12} /> {loading ? "Carregando..." : `${totalOrders} pedidos encontrados`}
            </p>
          </div>

          {loading ? (
            <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-purple-500" size={28} /></div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 text-center opacity-40 flex flex-col items-center gap-3">
              <ShoppingBag size={40} className="text-slate-400" />
              <p className="text-sm font-black text-slate-500">Nenhum pedido no período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {["#", "Data/Hora", "Cliente", "Tipo", "Pagamento", "Status", "Total"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, i) => {
                    const statusCfg = STATUS_LABELS[order.status] || { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" };
                    return (
                      <tr 
                        key={order.id} 
                        onClick={() => setDetailOrder(order)}
                        className={`border-b border-slate-50 hover:bg-purple-50 transition-colors cursor-pointer group ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs font-black text-slate-900 group-hover:text-purple-600">#{order.orderNumber || order.id.slice(-4).toUpperCase()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold text-slate-700">{formatDate(order.createdAt)}</p>
                          <p className="text-[10px] text-slate-400">{formatTime(order.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{order.customerName}</p>
                          {order.customerPhone && <p className="text-[10px] text-slate-400">{order.customerPhone}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {TYPE_LABELS[order.orderType] || order.orderType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-slate-600">{order.paymentMethod || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-black ${order.status === "CANCELED" ? "text-slate-300 line-through" : "text-purple-600"}`}>
                            {formatCurrency(order.total)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400">
                Página {page} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = page <= 3 ? i + 1 : page - 2 + i;
                  if (pg > totalPages) return null;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-9 h-9 rounded-lg text-xs font-black transition-all ${pg === page ? "bg-purple-600 text-white shadow-lg" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TABELA DE FECHAMENTOS DE CAIXA */
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-black text-slate-500 tracking-widest flex items-center gap-2">
              <Wallet size={12} /> {loading ? "Carregando..." : `${cashiers.length} fechamentos encontrados`}
            </p>
          </div>

          {loading ? (
            <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-purple-500" size={28} /></div>
          ) : cashiers.length === 0 ? (
            <div className="p-16 text-center opacity-40 flex flex-col items-center gap-3">
              <Wallet size={40} className="text-slate-400" />
              <p className="text-sm font-black text-slate-500">Nenhum fechamento no período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {["Abertura", "Fechamento", "Status", "Saldo Inicial", "Saldo Final (Notas)", "Diferença"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cashiers.map((session, i) => (
                    <tr key={session.id} className={`border-b border-slate-50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-slate-700">{formatDate(session.openedAt)}</p>
                        <p className="text-[10px] text-slate-400">{formatTime(session.openedAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        {session.closedAt ? (
                          <>
                            <p className="text-xs font-bold text-slate-700">{formatDate(session.closedAt)}</p>
                            <p className="text-[10px] text-slate-400">{formatTime(session.closedAt)}</p>
                          </>
                        ) : <span className="text-xs font-bold text-emerald-500 italic">Caixa Aberto</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${session.status === "OPEN" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {session.status === "OPEN" ? "ABERTO" : "FECHADO"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-xs text-slate-700">{formatCurrency(session.openingBalance || 0)}</td>
                      <td className="px-4 py-3 font-bold text-xs text-slate-900">{session.closingNotes ? session.closingNotes : "—"}</td>
                      <td className="px-4 py-3">
                        {session.closingNotes ? (
                          <span className="text-xs font-black text-purple-600">Conferido</span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: DETALHES DO PEDIDO (REUSANDO DESIGN DO PDV) */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[92vh] animate-in fade-in zoom-in duration-300 relative border-4 lg:border-8 border-white">
            <button
              onClick={() => setDetailOrder(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-slate-100/80 hover:bg-white text-slate-400 hover:text-slate-900 rounded-xl transition-all border border-slate-200/50"
            >
              <X size={18} />
            </button>

            {/* LADO ESQUERDO: ESTILO RECIBO */}
            <div className="lg:w-1/2 bg-slate-50 flex flex-col border-b lg:border-b-0 lg:border-r border-dashed border-slate-200">
              <div className="p-6 text-center space-y-4 relative border-b border-dashed border-slate-200">
                <div className="absolute -bottom-3 left-0 right-0 flex justify-around px-2 overflow-hidden opacity-20 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-slate-400 rounded-full shrink-0" />
                  ))}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg leading-tight">Itens da Comanda</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                    #{detailOrder.orderNumber || detailOrder.id.slice(-4).toUpperCase()} • {formatTime(detailOrder.createdAt)}
                  </p>
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                {detailOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="group relative">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-3 min-w-0">
                        <span className="text-xs font-black text-slate-300 group-hover:text-purple-500 transition-colors">{item.quantity}x</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold text-slate-800 truncate leading-none mb-1 ${item.isCanceled ? "line-through text-slate-400" : ""}`}>
                            {item.productName || item.product?.name}
                          </p>
                          {item.choices && (
                            <p className={`text-[9px] text-slate-500 leading-tight ${item.isCanceled ? "line-through opacity-50" : ""}`}>
                              + {renderChoicesStr(item.choices)}
                            </p>
                          )}
                          {item.notes && (
                            <div className="mt-1 flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 rounded text-[9px] text-purple-600 font-bold w-fit">
                              <ScrollText size={8} /> {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-black text-slate-900 shrink-0 ${item.isCanceled ? "line-through text-slate-300" : ""}`}>
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-100/50 border-t border-dashed border-slate-200">
                <div className="flex justify-between items-center text-slate-500 mb-1">
                  <span className="text-[10px] font-bold tracking-wider">Total de Itens</span>
                  <span className="text-xs font-black">
                    {formatCurrency(detailOrder.items?.reduce((acc: number, item: any) => acc + (item.isCanceled ? 0 : item.price * item.quantity), 0) || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: INFORMAÇÕES E TOTAIS */}
            <div className="lg:w-1/2 p-8 flex flex-col justify-between bg-white">
              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight mb-4 flex items-center gap-2">
                    <User size={20} className="text-purple-500" /> Detalhes do Cliente
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm"><User size={20} /></div>
                      <div>
                        <p className="text-xs font-black text-slate-800">{detailOrder.customerName}</p>
                        <p className="text-[10px] text-purple-600 font-bold tracking-widest">{detailOrder.customerPhone || "N/A"}</p>
                      </div>
                    </div>

                    {(detailOrder.orderType === "DELIVERY" || detailOrder.street) && (
                      <div className="pt-3 border-t border-slate-200">
                        <div className="flex items-start gap-3">
                          <MapPin size={14} className="text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-slate-900 font-black leading-tight">
                              {detailOrder.street}, {detailOrder.number}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold tracking-tighter mt-0.5">
                              {detailOrder.neighborhood || "N/A"}
                            </p>
                            {detailOrder.reference && (
                              <p className="text-[9px] text-purple-400 italic mt-1">Ref: {detailOrder.reference}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {detailOrder.orderType === "DINING_IN" && (
                      <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-purple-500" />
                          <span className="text-[10px] font-black text-slate-900 ">Mesa {detailOrder.table?.number}</span>
                        </div>
                        {detailOrder.waiter?.name && (
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 ">{detailOrder.waiter.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-slate-900 text-lg tracking-tight mb-2">Resumo Financeiro</h3>
                  <div className="space-y-2">
                    {(() => {
                      const subtotal = detailOrder.subtotal || detailOrder.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
                      const deliveryFee = detailOrder.deliveryFee || 0;
                      const discount = detailOrder.discount || 0;
                      const total = detailOrder.total;

                      return (
                        <>
                          <div className="flex justify-between items-center text-slate-500">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Subtotal</span>
                            <span className="text-xs font-black">{formatCurrency(subtotal)}</span>
                          </div>

                          {deliveryFee > 0 && (
                            <div className="flex justify-between items-center text-slate-500">
                              <span className="text-[10px] font-bold uppercase tracking-wider">Taxa de Entrega</span>
                              <span className="text-xs font-black">{formatCurrency(deliveryFee)}</span>
                            </div>
                          )}

                          {discount > 0 && (
                            <div className="flex justify-between items-center text-red-500">
                              <span className="text-[10px] font-bold uppercase tracking-wider">Desconto</span>
                              <span className="text-xs font-black">- {formatCurrency(discount)}</span>
                            </div>
                          )}

                          <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center">
                            <div>
                              <span className="text-[10px] font-black text-slate-400 block leading-none mb-1">TOTAL FINAL</span>
                              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{detailOrder.paymentMethod}</span>
                            </div>
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">
                              {formatCurrency(total)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={() => setDetailOrder(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
