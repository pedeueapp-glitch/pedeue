"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, Edit3, Trash2, Loader2,
  ScrollText, Clock, CheckCircle2, User, Printer, FileText
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { ConfirmModal } from "@/components/ConfirmModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { X, Download } from "lucide-react";

export default function QuotesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [store, setStore] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordRes, storeRes] = await Promise.all([
        fetch("/api/orders?orderType=SERVICE"),
        fetch("/api/store")
      ]);
      const data = await ordRes.json();
      setOrders(Array.isArray(data) ? data : []);
      setStore(await storeRes.json());
    } catch { toast.error("Erro ao carregar orçamentos"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      const res = await fetch(`/api/orders/${orderToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Orçamento removido");
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
      fetchData();
    } catch { toast.error("Erro ao remover"); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-600";
      case "PROCESSING": return "bg-blue-100 text-blue-600";
      case "DONE": return "bg-emerald-100 text-emerald-600";
      case "CANCELED": return "bg-red-100 text-red-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return "Orçamento";
      case "PROCESSING": return "Em Produção";
      case "DONE": return "Finalizado";
      case "CANCELED": return "Cancelado";
      default: return status;
    }
  };

  const handleConfirmSale = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PROCESSING" })
      });
      if (!res.ok) throw new Error();
      toast.success("Orçamento confirmado como venda!");
      fetchData();
    } catch {
      toast.error("Erro ao confirmar venda");
    }
  };

  const filteredOrders = orders.filter(o => 
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.id.includes(searchTerm)
  );

  const generatePDF = async (order: any) => {
    const doc = new jsPDF() as any;
    
    let currentY = 30;

    // Logo (se houver)
    if (store?.logo) {
      try {
        const img = new Image();
        img.src = store.logo;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const maxWidth = 50;
        const maxHeight = 30;
        let width = img.width;
        let height = img.height;
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
        
        doc.addImage(img, 'PNG', 20, 20, width, height);
        currentY = 20 + height + 10;
      } catch (e) {
        console.error("Erro ao carregar logo para PDF", e);
      }
    }

    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // Navy
    doc.text(store?.name || "Orçamento de Serviço", 20, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate
    doc.text(`Nº do Pedido: #${order.orderNumber || order.id.slice(-4).toUpperCase()}`, 20, currentY + 10);
    doc.text(`Data: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}`, 20, currentY + 15);
    doc.text(`Prazo de Entrega: ${order.deliveryDeadline ? new Date(order.deliveryDeadline).toLocaleDateString('pt-BR') : "A combinar"}`, 20, currentY + 20);

    // Cliente
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Cliente:", 20, currentY + 35);
    doc.setFontSize(10);
    doc.text(order.customerName, 20, currentY + 42);
    doc.text(order.customerPhone || "", 20, currentY + 47);

    // Tabela de Itens
    const tableData = order.items.map((i: any) => [
        i.productName || i.name,
        i.quantity.toString(),
        `R$ ${i.price.toFixed(2)}`,
        `R$ ${(i.price * i.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: currentY + 60,
      head: [['Produto/Serviço', 'Qtd', 'Preço Unit.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }, // Purple
      margin: { left: 20, right: 20 }
    });

    // Totais
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal: R$ ${(order.subtotal || order.total).toFixed(2)}`, 140, finalY);
    doc.text(`Desconto: R$ ${(order.discount || 0).toFixed(2)}`, 140, finalY + 7);
    doc.setFontSize(14);
    doc.text(`TOTAL: R$ ${order.total.toFixed(2)}`, 140, finalY + 17);

    doc.save(`Orcamento_${order.customerName.replace(/\s+/g, '_')}.pdf`);
    toast.success("PDF gerado!");
  };

  return (
    <>
      <Header title="Orçamentos e Serviços" />

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Histórico de Pedidos</h2>
            <p className="text-slate-400 text-sm mt-1">Acompanhe seus orçamentos e serviços em andamento.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cliente ou Nº Pedido..."
                className="input-field pl-11 !rounded-2xl"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => window.location.href = '/dashboard/pdv'}
              className="btn-primary flex items-center gap-2 !py-3.5 !rounded-2xl shadow-lg shadow-purple-500/20"
            >
              <Plus size={18} />
              <span>Novo Orçamento</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
            <span className="font-black  tracking-widest text-[10px] text-slate-400">Carregando...</span>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black  text-slate-400 tracking-widest">Pedido</th>
                    <th className="px-6 py-4 text-[10px] font-black  text-slate-400 tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-black  text-slate-400 tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black  text-slate-400 tracking-widest">Data</th>
                    <th className="px-6 py-4 text-[10px] font-black  text-slate-400 tracking-widest">Prazo</th>
                    <th className="px-6 py-4 text-[10px] font-black  text-slate-400 tracking-widest text-right">Total</th>
                    <th className="px-6 py-4 text-[10px] font-black  text-slate-400 tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-xs text-navy">#{order.orderNumber || order.id.slice(-4).toUpperCase()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                              <User size={12} />
                           </div>
                           <span className="text-xs font-semibold text-slate-700">{order.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black  px-2 py-1 rounded-md ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-purple-500">
                        {order.deliveryDeadline ? new Date(order.deliveryDeadline).toLocaleDateString("pt-BR") : "-"}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-navy text-right">
                        R$ {order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {order.status === "PENDING" && (
                            <button 
                              onClick={() => handleConfirmSale(order.id)}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Confirmar como Venda"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => { setSelectedOrder(order); setIsDetailModalOpen(true); }}
                            className="p-2 text-slate-400 hover:text-navy transition-colors"
                            title="Ver Detalhes"
                          >
                            <FileText size={16} />
                          </button>
                          <button 
                            onClick={() => generatePDF(order)}
                            className="p-2 text-slate-400 hover:text-purple-500 transition-colors"
                            title="Baixar PDF"
                          >
                            <Printer size={16} />
                          </button>
                          <button 
                            onClick={() => { setOrderToDelete(order.id); setIsDeleteModalOpen(true); }}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredOrders.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                <ScrollText className="mx-auto mb-4 opacity-20" size={40} />
                <p className="text-sm font-medium">Nenhum orçamento encontrado.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setIsDetailModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-[40px] p-8 lg:p-12 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-navy  tracking-tight">Detalhes do Pedido #{selectedOrder.orderNumber || selectedOrder.id.slice(-4).toUpperCase()}</h2>
                <p className="text-slate-400 text-xs mt-1 font-medium">Informações completas do serviço/venda.</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><X size={20}/></button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-purple-500 shadow-sm">
                   <User size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{selectedOrder.customerName}</h4>
                  <p className="text-xs text-slate-500 font-medium">{selectedOrder.customerPhone || "Telefone não informado"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black  text-slate-400 tracking-widest mb-1">Status</p>
                  <span className={`text-[10px] font-black  px-2 py-1 rounded-md ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black  text-slate-400 tracking-widest mb-1">Prazo de Entrega</p>
                  <p className="text-xs font-bold text-purple-500">
                    {selectedOrder.deliveryDeadline ? new Date(selectedOrder.deliveryDeadline).toLocaleString("pt-BR") : "Não definido"}
                  </p>
                </div>
              </div>

              <div>
                 <p className="text-[10px] font-black  text-slate-400 tracking-widest mb-3">Itens do Pedido</p>
                 <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400">{item.quantity}x</span>
                            <span className="text-xs font-bold text-navy">{item.productName || item.name}</span>
                         </div>
                         <span className="text-xs font-black text-navy">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                 <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold">Subtotal: R$ {(selectedOrder.subtotal || selectedOrder.total).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400 font-bold">Desconto: R$ {(selectedOrder.discount || 0).toFixed(2)}</p>
                    <p className="text-xl font-black text-navy">TOTAL: R$ {selectedOrder.total.toFixed(2)}</p>
                 </div>
                 <button 
                  onClick={() => generatePDF(selectedOrder)}
                  className="btn-primary flex items-center gap-2 !py-3 !px-6 !rounded-xl"
                 >
                    <Download size={18} />
                    <span>Baixar PDF</span>
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Remover Orçamento?"
        message="Esta ação é irreversível."
        confirmText="Sim, Remover"
      />
    </>
  );
}
