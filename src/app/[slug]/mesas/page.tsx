"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Users, 
  Lock, 
  LogIn, 
  Loader2, 
  Utensils, 
  Plus, 
  X, 
  Search, 
  ShoppingBag,
  CheckCircle2,
  Trash2,
  ShoppingBasket
} from "lucide-react";
import toast from "react-hot-toast";
import { useEffect as useSocketEffect, useRef } from "react";
import { io } from "socket.io-client";

interface WaiterSession {
  token: string;
  waiter: { id: string; name: string };
  store: { id: string; name: string };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function WaiterTablesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const socketRef = useRef<any>(null);

  useSocketEffect(() => {
    if (typeof window !== 'undefined') {
      const socket = io(window.location.origin, {
        path: "/socket.io/",
        transports: ["websocket"]
      });
      socketRef.current = socket;
      return () => {
        socket.disconnect();
      };
    }
  }, []);
  
  const [session, setSession] = useState<WaiterSession | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Login State
  const [loginData, setLoginData] = useState({ name: "", password: "" });
  const [loggingIn, setLoggingIn] = useState(false);
  
  // Dashboard State
  const [tables, setTables] = useState<any[]>([]);
  const [pdvSettings, setPdvSettings] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedProductForOptions, setSelectedProductForOptions] = useState<any>(null);
  const [productOptionsSelection, setProductOptionsSelection] = useState<any>({});
  const [itemQuantity, setItemQuantity] = useState(1);
  const [savingOrder, setSavingOrder] = useState(false);
  const [observations, setObservations] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(`waiter_session_${slug}`);
    if (saved) {
      setSession(JSON.parse(saved));
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    if (session) {
      fetchTables();
      fetchProducts();
    }
  }, [session]);

  const fetchTables = async () => {
    try {
      const res = await fetch(`/api/tables?storeId=${session?.store.id}`, {
        headers: { "Authorization": `Bearer ${session?.token}` }
      });
      const data = await res.json();
      setTables(data.tables || []);
      setPdvSettings(data.settings);
    } catch { toast.error("Erro ao carregar mesas"); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?storeId=${session?.store.id}`, {
        headers: { "Authorization": `Bearer ${session?.token}` }
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { toast.error("Erro ao carregar produtos"); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const res = await fetch("/api/waiters/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...loginData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      localStorage.setItem(`waiter_session_${slug}`, JSON.stringify(data));
      setSession(data);
      toast.success(`Bem-vindo, ${data.waiter.name}!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`waiter_session_${slug}`);
    setSession(null);
  };

  // Order Logic
  const openTable = (table: any) => {
    setSelectedTable(table);
    setShowOrderModal(true);
    // If table has an active order, we should ideally load it. 
    // For now, let's just allow adding new items to the table.
    setCart([]); 
    setObservations("");
  };

  const addToCart = (product: any) => {
    setItemQuantity(1);
    if (product.optiongroup && product.optiongroup.length > 0) {
      setSelectedProductForOptions(product);
      setProductOptionsSelection({});
      return;
    }
    
    const price = product.salePrice || product.price;
    setCart(prev => [...prev, { ...product, price, quantity: 1, notes: "" }]);
    toast.success(`${product.name} adicionado`);
  };

  const addToCartWithOptions = () => {
    const p = selectedProductForOptions;
    
    // Validate required options
    for (const group of p.optiongroup) {
      const selectedInGroup = Object.values(productOptionsSelection)
        .filter((opt: any) => opt.groupId === group.id).length;
      if (selectedInGroup < group.minOptions) {
        return toast.error(`Selecione no mínimo ${group.minOptions} de ${group.name}`);
      }
    }

    // Logic for HIGHEST/AVERAGE pricing
    const originalBasePrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
    let currentBasePrice = originalBasePrice;
    let sumOfAdicionais = 0;
    const selectedKeys = Object.keys(productOptionsSelection);

    for (const group of p.optiongroup) {
      const selectedInGroup = selectedKeys
        .filter(k => productOptionsSelection[k].groupId === group.id)
        .map(k => Number(productOptionsSelection[k].price));

      if (selectedInGroup.length > 0) {
        const calcType = group.priceCalculation || "SUM";
        if (calcType === "HIGHEST") {
          const highestOption = Math.max(...selectedInGroup);
          if (highestOption > currentBasePrice) currentBasePrice = highestOption;
        } else if (calcType === "AVERAGE") {
          const sumOptions = selectedInGroup.reduce((a, b) => a + b, 0);
          const avg = (originalBasePrice + sumOptions) / (selectedInGroup.length + 1);
          if (avg > currentBasePrice) currentBasePrice = avg;
        } else {
          sumOfAdicionais += selectedInGroup.reduce((a, b) => a + b, 0);
        }
      }
    }

    const finalPrice = currentBasePrice + sumOfAdicionais;
    const notes = selectedKeys.map(k => productOptionsSelection[k].name).join(", ");

    setCart(prev => [...prev, { 
      ...p, 
      price: finalPrice, 
      quantity: itemQuantity, 
      notes,
      optionsText: notes 
    }]);

    setSelectedProductForOptions(null);
    setItemQuantity(1);
    toast.success(`${p.name} adicionado`);
  };

  const handleFinishOrder = async () => {
    if (cart.length === 0) return toast.error("Adicione itens");
    setSavingOrder(true);
    try {
      const res = await fetch("/api/orders/table", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.token}`
        },
        body: JSON.stringify({
          tableId: selectedTable.id,
          waiterId: session?.waiter.id,
          storeId: session?.store.id,
          observations,
          items: cart.map(i => ({
            productId: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            notes: i.notes
          }))
        })
      });
      if (!res.ok) throw new Error();
      
      // Notificar PDV via WebSocket
      if (socketRef.current) {
        socketRef.current.emit("new-order-trigger", { 
          storeId: session?.store.id 
        });
      }

      toast.success("Pedido enviado para a mesa!");
      setCart([]);
      setShowOrderModal(false);
      fetchTables();
    } catch {
      toast.error("Erro ao enviar pedido");
    } finally {
      setSavingOrder(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-purple-500" /></div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-10 bg-slate-900 text-white text-center space-y-4">
             <div className="w-20 h-20 bg-purple-500 rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-purple-500/20">
                <Utensils size={40} />
             </div>
             <div>
                <h1 className="text-2xl font-black tracking-tight">Painel do Garçom</h1>
                <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-2">Acesso Restrito</p>
             </div>
          </div>
          
          <form onSubmit={handleLogin} className="p-10 space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 uppercase">Nome do Garçom</label>
                <div className="relative">
                   <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" 
                    placeholder="Seu nome cadastrado"
                    value={loginData.name}
                    onChange={e => setLoginData({...loginData, name: e.target.value})}
                    required
                   />
                </div>
             </div>
             
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 uppercase">Senha de Acesso</label>
                <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input 
                    type="password" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" 
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={e => setLoginData({...loginData, password: e.target.value})}
                    required
                   />
                </div>
             </div>

             <button 
               type="submit" 
               disabled={loggingIn}
               className="w-full py-5 bg-purple-500 text-white rounded-[24px] font-black tracking-widest uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-purple-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
             >
                {loggingIn ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                Entrar no Painel
             </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header removido conforme solicitado */}
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 lg:hidden">
         <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">{session.store.name}</h2>
         <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-all">
            <LogIn size={18} className="rotate-180" />
         </button>
      </div>


      {/* Grid de Mesas */}
      <main className="flex-1 p-6 overflow-y-auto no-scrollbar">
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map(table => {
               const isOccupied = table.order && table.order.length > 0;
               return (
                  <button 
                    key={table.id}
                    onClick={() => openTable(table)}
                    className={`aspect-square rounded-[32px] border-2 flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-sm hover:shadow-md ${isOccupied ? 'border-none' : 'border-slate-100 bg-white text-slate-400'}`}
                    style={{ backgroundColor: isOccupied ? (pdvSettings?.tableOccupiedColor || "#ef4444") : undefined }}
                  >
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isOccupied ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-300'}`}>
                        <Utensils size={24} />
                     </div>
                     <span className={`text-xl font-black ${isOccupied ? 'text-white' : 'text-slate-800'}`}>Mesa {table.number}</span>
                     {isOccupied && <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Em Aberto</span>}
                  </button>
               );
            })}
         </div>
      </main>

      {/* Modal de Pedido (PDV Style) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[50] flex flex-col lg:flex-row animate-in fade-in duration-300">
           {/* Mobile header for modal */}
           <div className="lg:hidden bg-white px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-black text-navy text-sm uppercase tracking-widest">Pedido Mesa {selectedTable?.number}</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400"><X size={20}/></button>
           </div>

           {/* Painel de Produtos (Esquerda no Desktop) */}
           <div className="flex-1 flex flex-col min-h-0 bg-white">
              <div className="p-4 border-b">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar itens..." 
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 gap-2">
                    {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                       <button 
                         key={p.id}
                         onClick={() => addToCart(p)}
                         className="bg-white border border-slate-100 p-2 rounded-xl flex flex-col items-center text-center gap-2 hover:border-purple-500 transition-all group active:scale-95 shadow-sm"
                       >
                          <div className="w-full aspect-square bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center">
                             {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <ShoppingBag size={20} className="text-slate-200" />}
                          </div>
                          <div className="w-full">
                             <p className="text-[9px] font-black text-navy line-clamp-1">{p.name}</p>
                             <p className="text-[10px] font-black text-purple-600 mt-0.5">R$ {(p.salePrice || p.price).toFixed(2)}</p>
                          </div>
                       </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* Painel de Carrinho (Direita no Desktop) */}
           <div className="w-full lg:w-[400px] bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col max-h-[50vh] lg:max-h-none overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-white hidden lg:flex items-center justify-between">
               <h3 className="font-black text-navy text-sm uppercase tracking-widest">Resumo da Mesa {selectedTable?.number}</h3>
               <button onClick={() => setShowOrderModal(false)} className="text-slate-400"><X size={20}/></button>
            </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                 {cart.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-10">
                      <ShoppingBasket size={48} className="text-slate-400 mb-2" />
                      <p className="text-xs font-black tracking-widest uppercase">Nenhum item</p>
                   </div>
                 ) : (
                   cart.map((item, idx) => (
                     <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-right-4">
                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                           {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <ShoppingBag size={16} className="text-slate-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[11px] font-black text-navy line-clamp-1">{item.name}</p>
                           {item.notes && <p className="text-[9px] text-slate-400 font-bold italic line-clamp-1">{item.notes}</p>}
                           <p className="text-[10px] font-black text-purple-600 mt-0.5">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                              <button 
                                onClick={() => {
                                  const newCart = [...cart];
                                  newCart[idx].quantity = Math.max(1, newCart[idx].quantity - 1);
                                  setCart(newCart);
                                }}
                                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-navy active:scale-90"
                              >-</button>
                              <span className="w-5 text-center text-[10px] font-black text-navy">{item.quantity}</span>
                              <button 
                                onClick={() => {
                                  const newCart = [...cart];
                                  newCart[idx].quantity += 1;
                                  setCart(newCart);
                                }}
                                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-navy active:scale-90"
                              >+</button>
                           </div>
                           <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-400 p-2 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={14} />
                           </button>
                        </div>
                     </div>
                   ))
                 )}
              </div>

               <div className="px-6 py-2 bg-white border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 block">Observações do Pedido</label>
                  <textarea 
                    placeholder="Ex: Sem cebola, gelo e limão..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] font-bold outline-none focus:border-purple-500 min-h-[60px] no-scrollbar"
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                  />
               </div>

              <div className="p-6 bg-white border-t border-slate-100 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Total Pedido</span>
                    <span className="text-2xl font-black text-navy">{formatCurrency(cart.reduce((sum, i) => sum + (i.price * i.quantity), 0))}</span>
                 </div>
                 <button 
                  onClick={handleFinishOrder}
                  disabled={savingOrder || cart.length === 0}
                  className="w-full py-5 bg-green-500 text-white rounded-[24px] font-black tracking-widest uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                 >
                    {savingOrder ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                    {savingOrder ? "Enviando..." : "Enviar p/ Cozinha"}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Opcionais (Copiado do PDV) */}
      {selectedProductForOptions && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border w-full max-w-md rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50 shrink-0">
               <div>
                  <h3 className="font-black text-navy text-sm uppercase tracking-widest">{selectedProductForOptions.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Personalize seu pedido</p>
               </div>
               <button onClick={() => setSelectedProductForOptions(null)} className="p-2 text-slate-400 hover:text-navy transition-colors">
                  <X size={20}/>
               </button>
            </div>

            <div className="p-5 border-b bg-white flex items-center justify-between">
               <span className="text-xs font-black text-navy uppercase tracking-widest">Quantidade</span>
               <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button 
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-white text-navy rounded-lg shadow-sm font-black active:scale-90 transition-all"
                  >-</button>
                  <span className="w-8 text-center font-black text-navy text-lg">{itemQuantity}</span>
                  <button 
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white text-navy rounded-lg shadow-sm font-black active:scale-90 transition-all"
                  >+</button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white no-scrollbar">
              {selectedProductForOptions.optiongroup.map((group: any) => {
                const selectedInGroup = Object.values(productOptionsSelection)
                  .filter((opt: any) => opt.groupId === group.id).length;

                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <h4 className="font-black text-[10px] text-slate-800 tracking-tight uppercase">{group.name}</h4>
                        <p className="text-[9px] font-bold text-slate-500">
                          {group.minOptions > 0 ? `Mín: ${group.minOptions}` : "Opcional"} • Máx: {group.maxOptions}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${selectedInGroup >= group.minOptions && selectedInGroup <= group.maxOptions ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>
                        {selectedInGroup}/{group.maxOptions}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.option.map((opt: any) => {
                        const isSelected = !!productOptionsSelection[opt.id];
                        return (
                          <label 
                            key={opt.id} 
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? "border-purple-500 bg-purple-50 shadow-sm" : "border-slate-50 bg-white hover:border-slate-200"}`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type={group.maxOptions === 1 ? "radio" : "checkbox"}
                                name={`group-${group.id}`}
                                checked={isSelected}
                                onChange={(e) => {
                                  setProductOptionsSelection((prev: any) => {
                                    const next = { ...prev };
                                    if (group.maxOptions === 1) {
                                      // Se for rádio, remove todos do mesmo grupo antes
                                      Object.keys(next).forEach(k => {
                                        if (next[k].groupId === group.id) delete next[k];
                                      });
                                      next[opt.id] = { ...opt, groupId: group.id };
                                    } else if (e.target.checked) {
                                      if (selectedInGroup >= group.maxOptions) {
                                        toast.error(`Máximo de ${group.maxOptions} opções`);
                                        return prev;
                                      }
                                      next[opt.id] = { ...opt, groupId: group.id };
                                    } else {
                                      delete next[opt.id];
                                    }
                                    return next;
                                  });
                                }}
                                className="accent-purple-600 w-4 h-4"
                              />
                              <span className="font-black text-xs text-slate-700">{opt.name}</span>
                            </div>
                            <span className="font-black text-[10px] text-slate-400">
                              {opt.price > 0 ? `+ R$ ${opt.price.toFixed(2)}` : "Grátis"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 border-t bg-slate-50 shrink-0">
               <button onClick={addToCartWithOptions} className="w-full py-5 bg-purple-500 text-white rounded-[24px] font-black text-xs tracking-widest hover:brightness-110 transition-all flex items-center justify-between px-8 gap-2 shadow-lg shadow-purple-500/20">
                  <div className="flex items-center gap-2">
                    <Plus size={16} /> 
                    <span>Adicionar Opcionais</span>
                  </div>
                  <span className="text-sm font-black">
                    R$ {(() => {
                      const p = selectedProductForOptions;
                      const originalBasePrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
                      let currentBasePrice = originalBasePrice;
                      let sumOfAdicionais = 0;
                      for (const group of p.optiongroup) {
                        const selectedInGroup = Object.keys(productOptionsSelection)
                          .filter(k => productOptionsSelection[k].groupId === group.id)
                          .map(k => Number(productOptionsSelection[k].price));

                        if (selectedInGroup.length > 0) {
                          const calcType = group.priceCalculation || "SUM";
                          if (calcType === "HIGHEST") {
                            const highestOption = Math.max(...selectedInGroup);
                            if (highestOption > currentBasePrice) currentBasePrice = highestOption;
                          } else if (calcType === "AVERAGE") {
                            const sumOptions = selectedInGroup.reduce((a, b) => a + b, 0);
                            const avg = (originalBasePrice + sumOptions) / (selectedInGroup.length + 1);
                            if (avg > currentBasePrice) currentBasePrice = avg;
                          } else {
                            sumOfAdicionais += selectedInGroup.reduce((a, b) => a + b, 0);
                          }
                        }
                      }
                      return (currentBasePrice + sumOfAdicionais).toFixed(2).replace('.', ',');
                    })()}
                  </span>
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
