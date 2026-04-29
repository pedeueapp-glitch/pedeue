"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Clock, 
  User, 
  ChevronRight, 
  X, 
  Sparkles, 
  ArrowLeft,
  Calendar,
  AlertCircle,
  TrendingUp,
  Target,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";

const formatCurrency = (val: number) => {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCart, setSelectedCart] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/pdv/abandoned-carts");
      const data = await res.json();
      if (Array.isArray(data)) setCarts(data);
    } catch (e) {
      toast.error("Erro ao carregar carrinhos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCarts = carts.filter(c => 
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerPhone?.includes(searchTerm)
  );

  const stats = {
    total: carts.length,
    value: carts.reduce((acc, c) => acc + c.total, 0),
    avgTime: carts.length > 0 ? Math.floor(carts.reduce((acc, c) => acc + c.durationSeconds, 0) / carts.length) : 0
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <ShoppingCart className="text-purple-600" size={32} />
            Carrinhos Abandonados
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Monitore e recupere vendas que quase aconteceram na sua vitrine.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <Search className="text-slate-400 ml-2" size={18} />
          <input 
            type="text" 
            placeholder="Buscar cliente ou telefone..."
            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-purple-50 rounded-3xl">
            <Target className="text-purple-600" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Carrinhos</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-emerald-50 rounded-3xl">
            <TrendingUp className="text-emerald-600" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor em Aberto</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(stats.value)}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-blue-50 rounded-3xl">
            <Clock className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Médio</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.avgTime}s</p>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Desistiu em</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                       <ShoppingCart className="animate-bounce" size={40} />
                       <p className="font-black text-xs uppercase tracking-widest">Carregando carrinhos...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCarts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                       <AlertCircle size={48} />
                       <p className="font-black text-sm uppercase tracking-widest">Nenhum carrinho abandonado encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCarts.map((cart) => (
                <tr key={cart.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{cart.customerName || "Visitante Anônimo"}</p>
                        <p className="text-[10px] font-bold text-slate-500">{cart.customerPhone || "Identidade Oculta"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-600">
                    {JSON.parse(cart.items || '[]').length} itens
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-slate-900">
                    {formatCurrency(cart.total)}
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase tracking-tighter border border-red-100">
                      {cart.lastStep}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-500">
                    {format(new Date(cart.abandonedAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedCart(cart)}
                      className="p-3 bg-purple-50 text-purple-600 rounded-2xl hover:bg-purple-600 hover:text-white transition-all shadow-lg shadow-purple-600/10 group-hover:scale-110"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedCart && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border-[12px] border-white">
            <div className="p-10 border-b border-dashed border-slate-100 flex justify-between items-center bg-purple-50/50">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-white rounded-3xl shadow-sm border border-slate-100">
                     <ShoppingCart className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-2xl tracking-tighter">Análise do Carrinho</h3>
                    <p className="text-[10px] text-purple-600 font-black uppercase tracking-[0.2em]">
                      Sessão #{selectedCart.id.slice(-4).toUpperCase()}
                    </p>
                  </div>
               </div>
               <button
                 onClick={() => setSelectedCart(null)}
                 className="p-4 bg-white hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-3xl transition-all border border-slate-200"
               >
                 <X size={20} />
               </button>
            </div>

            <div className="p-12 space-y-10 max-h-[75vh] overflow-y-auto no-scrollbar">
               {/* CLIENT INFO */}
               <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cliente</p>
                     <p className="text-xl font-black text-slate-900 leading-none">{selectedCart.customerName || "Anônimo"}</p>
                     <p className="text-xs font-bold text-slate-500 mt-2">{selectedCart.customerPhone || "Sem contato"}</p>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Abandono</p>
                     <p className="text-xl font-black text-red-500 uppercase leading-none">{selectedCart.lastStep}</p>
                     <p className="text-xs font-bold text-slate-500 mt-2">Duração: {selectedCart.durationSeconds}s</p>
                  </div>
               </div>

               {/* ITEMS */}
               <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Conteúdo do Carrinho</h4>
                  <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-4">
                     {JSON.parse(selectedCart.items || '[]').map((item: any, i: number) => (
                       <div key={i} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-black text-[10px] text-purple-600">{item.quantity}x</span>
                            <span className="font-bold text-slate-700">{item.name}</span>
                          </div>
                          <span className="font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
                       </div>
                     ))}
                     <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-base font-black text-slate-900">Total Desistido</span>
                        <span className="text-xl font-black text-purple-600">{formatCurrency(selectedCart.total)}</span>
                     </div>
                  </div>
               </div>

               {/* AI ANALYSIS */}
               <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">🤖 Inteligência e Sugestão</h4>
                  <div className="bg-[#0f172a] rounded-[2.5rem] p-10 text-white space-y-6 relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkles size={120} />
                     </div>
                     
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4">Análise Comportamental</p>
                        <p className="text-base font-medium text-slate-300 leading-relaxed">
                          {selectedCart.lastStep === "PAYMENT" ? "O abandono ocorreu no momento do pagamento. Isso indica alta intenção de compra, mas possível barreira no checkout ou falta do método preferido." : 
                           selectedCart.lastStep === "CHECKOUT" ? "O cliente desistiu após ver o resumo. Provavelmente impactado pelo valor da entrega ou tempo estimado." : 
                           "Navegação exploratória. O cliente adicionou itens mas ainda não estava pronto para converter."}
                        </p>
                     </div>

                     <div className="relative z-10 pt-8 border-t border-white/10">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Ação de Recuperação</p>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
                                <Sparkles size={24} />
                              </div>
                              <p className="text-base font-black">
                                {selectedCart.customerPhone ? "Envie um cupom de desconto agora!" : "Simplifique as etapas iniciais de compra."}
                              </p>
                           </div>
                           
                           {selectedCart.customerPhone && (
                             <button 
                               onClick={() => {
                                 const msg = encodeURIComponent(`Olá ${selectedCart.customerName || ''}, vimos que você deixou alguns itens no carrinho. Use o cupom VOLTE10 para ganhar 10% de desconto e finalize seu pedido agora!`);
                                 window.open(`https://wa.me/55${selectedCart.customerPhone.replace(/\D/g, '')}?text=${msg}`, "_blank");
                               }}
                               className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95"
                             >
                               <MessageSquare size={20} />
                               Recuperar via Whats
                             </button>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
