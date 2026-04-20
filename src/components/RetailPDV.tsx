"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ShoppingBag, Search, Plus, Minus, Trash2, 
  CreditCard, Banknote, Smartphone, User, Loader2, Barcode,
  AlertCircle, Package, Receipt, LogOut, Menu, CheckCircle2, X
} from "lucide-react";
import toast from "react-hot-toast";
import { useSidebar } from "@/app/dashboard/layout";

interface RetailPDVProps {
  storeId: string;
}

export default function RetailPDV({ storeId }: RetailPDVProps) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [cashier, setCashier] = useState<any>(null);
  
  const { toggle } = useSidebar();

  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CARTÃO DE CRÉDITO");
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Controle de Caixa
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [cashierAction, setCashierAction] = useState<"OPEN" | "CLOSE">("OPEN");
  const [openingBalance, setOpeningBalance] = useState("0");

  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any>(null);

  useEffect(() => {
    fetchData();
    // Auto-focus barcode on load
    setTimeout(() => barcodeInputRef.current?.focus(), 500);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/pdv/retail");
      const data = await res.json();
      setProducts(data.products || []);
      setCashier(data.cashier);
    } catch {
      toast.error("Erro ao sincronizar PDV");
    } finally {
      setLoading(false);
    }
  }

  // --- BUSCA POR CÓDIGO DE BARRAS OU NOME ---
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    let foundMatch = false;

    // Tentar encontrar por código de barras exato na variante ou produto principal
    for (const prod of products) {
      if (prod.barcode && prod.barcode.toLowerCase() === query) {
        addToCart(prod, null, "");
        foundMatch = true;
        break;
      }
      if (prod.variants) {
        for (const variant of prod.variants) {
          if (variant.barcode && variant.barcode.toLowerCase() === query) {
             addToCart(prod, variant, variant.sizes.length > 0 ? variant.sizes[0] : ""); // Pick first size if barcode matches variant directly
             foundMatch = true;
             break;
          }
        }
      }
      if (foundMatch) break;
    }

    if (!foundMatch) {
       toast.error("Código de barras não encontrado.");
    }
    setSearchQuery("");
  }

  function addToCart(product: any, variant: any = null, size: string = "") {
    // Se o produto tem variantes, exija a seleção manual na tela (a menos que tenha sido via barcode direto)
    if (product.variants && product.variants.length > 0 && !variant) {
       // Aqui poderíamos abrir um modal de variação, mas para simplicidade do teclado/mouse PDV,
       // exigiremos clique manual nas variantes na grid, que passará a variante = null primeiro.
       toast.error("Por favor, selecione uma cor e tamanho específicos na lista.");
       return;
    }

    const cartId = Date.now().toString();
    const variantText = variant ? `Cor: ${variant.color} | Tam: ${size}` : "";

    setCart(prev => [...prev, {
      id: cartId,
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      variantText,
      price: product.price,
      qty: 1
    }]);

    toast.success("Item adicionado");
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(c => c.id !== id));
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(c => {
      if (c.id === id) {
        const newQty = Math.max(1, c.qty + delta);
        return { ...c, qty: newQty };
      }
      return c;
    }));
  }

  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

  async function handleCheckout() {
    if (!cashier) return toast.error("Por favor, abra o caixa na tela de dashboard antes de registrar vendas.");
    if (cart.length === 0) return toast.error("O carrinho está vazio.");

    setCheckoutLoading(true);
    const toastId = toast.loading("Processando venda...");

    try {
      const res = await fetch("/api/pdv/retail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          cart,
          customerName,
          customerPhone,
          paymentMethod,
          total: subtotal
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Venda registrada com sucesso!", { id: toastId });
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      barcodeInputRef.current?.focus();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar venda", { id: toastId });
    } finally {
      setCheckoutLoading(false);
    }
  }

  // --- CONTROLE DE CAIXA ---
  async function handleCashierAction() {
    setLoading(true);
    try {
      const res = await fetch("/api/pdv/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: cashierAction,
          openingBalance: parseFloat(openingBalance || "0")
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (cashierAction === "OPEN") {
        setCashier(data.cashier);
        toast.success("Caixa aberto com sucesso!");
      } else {
        setCashier(null);
        toast.success("Caixa fechado com sucesso!");
      }
      setIsCashierModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar caixa");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !isCashierModalOpen) return (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center">
      <Loader2 size={40} className="animate-spin text-orange-500 mb-4" />
      <p className="font-bold uppercase tracking-widest text-slate-400 text-xs">Sincronizando PDV Loja...</p>
    </div>
  );

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-slate-50 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ===== LADO ESQUERDO: CATÁLOGO E BUSCA ===== */}
      <div className="flex-1 flex flex-col h-full bg-white border-r border-slate-100">
        
        {/* Header do Caixa */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#0f172a] text-white">
           <div className="flex items-center gap-3">
             <button onClick={toggle} className="lg:hidden p-2 -ml-2 text-slate-300 hover:text-white transition-all">
               <Menu size={24} />
             </button>
             <div className="bg-orange-500 p-2 rounded-none hidden lg:block">
               <Receipt size={20} />
             </div>
             <div>
               <h1 className="font-black text-lg uppercase tracking-tight">PDV Vitrine</h1>
               <div className="flex items-center gap-2 mt-0.5">
                 <div className={`w-2 h-2 rounded-none ${cashier ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                   {cashier ? `Caixa Aberto (ID: ${cashier.id?.substring(0,8) || ''})` : "CAIXA FECHADO"}
                 </span>
               </div>
             </div>
           </div>
           
           <button 
             onClick={() => {
               setCashierAction(cashier ? "CLOSE" : "OPEN");
               setIsCashierModalOpen(true);
             }}
             className={`px-4 py-2 font-black uppercase text-[10px] tracking-widest transition-all rounded-none border-2 ${cashier ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-green-500 text-green-400 hover:bg-green-500/10'}`}
           >
             {cashier ? "Fechar Caixa" : "Abrir Caixa"}
           </button>
        </div>

        {/* Barra principal de busca / BARRAS */}
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <form onSubmit={handleSearch} className="relative">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-200 text-slate-500 p-1.5 rounded-none">
               <Barcode size={18} />
             </div>
             <input 
               ref={barcodeInputRef}
               type="text"
               placeholder="Leia o Código de Barras (SKU) ou busque por Nome e dê [ENTER]"
               className="w-full bg-white border-2 border-slate-200 focus:border-orange-500 px-14 py-5 font-black uppercase text-sm outline-none transition-all rounded-none placeholder-slate-400"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
          </form>
        </div>

        {/* Lista de Produtos Manuais (Caso falte codigo de barras) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Acesso Rápido - Manual</p>
           
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => {
                const hasVariants = product.variants && product.variants.length > 0;
                return (
                  <div 
                    key={product.id} 
                    onClick={() => {
                       if (hasVariants) {
                         setSelectedProductForVariant(product);
                       } else {
                         addToCart(product);
                       }
                    }}
                    className="bg-white border text-center border-slate-200 p-4 hover:border-orange-500 transition-all cursor-pointer rounded-none flex flex-col h-full group relative"
                  >
                     {product.imageUrl ? (
                       <img src={product.imageUrl} className="w-16 h-16 object-cover mx-auto mb-3" />
                     ) : (
                       <Package size={32} className="text-slate-300 mx-auto mb-3" />
                     )}
                     <h3 className="text-xs font-black text-slate-800 uppercase line-clamp-2 leading-tight flex-1">{product.name}</h3>
                     <p className="text-orange-600 font-black text-sm mt-2">R$ {product.price.toFixed(2).replace('.', ',')}</p>

                     {hasVariants && (
                       <div className="absolute top-2 right-2 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest rounded-none">
                         Opções
                       </div>
                     )}
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      {/* ===== LADO DIREITO: CARRINHO E CHECKOUT ===== */}
      <div className="w-full lg:w-[450px] bg-white flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.05)] border-l border-slate-200 z-10">
         
         <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <ShoppingBag size={18} className="text-orange-500" /> Venda Atual
            </h2>
         </div>

         {/* Cliente */}
         <div className="p-6 border-b border-slate-100 space-y-3">
             <div className="flex gap-3">
               <div className="p-3 bg-slate-100 text-slate-500 rounded-none"><User size={18} /></div>
               <input 
                 className="flex-1 bg-slate-50 border border-slate-200 font-bold text-xs uppercase px-4 outline-none focus:border-slate-400 rounded-none" 
                 placeholder="Nome do Cliente (Opcional)"
                 value={customerName}
                 onChange={e => setCustomerName(e.target.value)}
               />
             </div>
             <div className="flex gap-3">
               <div className="p-3 bg-slate-100 text-slate-500 rounded-none"><Smartphone size={18} /></div>
               <input 
                 className="flex-1 bg-slate-50 border border-slate-200 font-bold text-xs uppercase px-4 outline-none focus:border-slate-400 rounded-none" 
                 placeholder="Telefone (Opcional)"
                 value={customerPhone}
                 onChange={e => setCustomerPhone(e.target.value)}
               />
             </div>
         </div>

         {/* Itens do Carrinho */}
         <div className="flex-1 overflow-y-auto p-6 space-y-3">
             {cart.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center px-6">
                 <Barcode size={48} className="mb-4 opacity-50" />
                 <p className="font-black uppercase text-xs tracking-widest leading-relaxed">Leia o código de barras ou adicione itens pelo painel para iniciar a venda.</p>
               </div>
             ) : (
               cart.map((item, idx) => (
                 <div key={item.id} className="bg-white border border-slate-200 p-4 rounded-none group hover:border-orange-500 transition-all flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                       <h4 className="font-black text-slate-900 uppercase text-xs leading-tight line-clamp-1">{item.name}</h4>
                       {item.variantText && <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{item.variantText}</p>}
                       <p className="text-orange-600 font-black text-sm mt-1">R$ {item.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1 bg-slate-100 p-1">
                          <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-200"><Minus size={12} /></button>
                          <span className="w-8 text-center font-black text-xs">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-200"><Plus size={12} /></button>
                       </div>
                       <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                         <Trash2 size={16} />
                       </button>
                    </div>
                 </div>
               ))
             )}
         </div>

         {/* Pagamento e Fechamento */}
         <div className="p-6 bg-slate-900 border-t-4 border-orange-500">
             
             {/* Total */}
             <div className="flex justify-between items-end mb-6">
                 <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total a Pagar</span>
                 <span className="text-3xl font-black text-white">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
             </div>

             {/* Metodos */}
             <div className="grid grid-cols-2 gap-2 mb-6">
                {[
                  { name: "DINHEIRO", icon: Banknote },
                  { name: "CARTÃO DE CRÉDITO", icon: CreditCard },
                  { name: "CARTÃO DE DÉBITO", icon: CreditCard },
                  { name: "PIX", icon: Smartphone }
                ].map(method => (
                  <button 
                    key={method.name}
                    onClick={() => setPaymentMethod(method.name)}
                    className={`py-3 px-2 flex items-center gap-2 border-2 transition-all rounded-none ${paymentMethod === method.name ? 'border-orange-500 bg-orange-500/20 text-white' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <method.icon size={16} className={paymentMethod === method.name ? 'text-orange-500' : ''} />
                    <span className="font-black uppercase text-[9px] tracking-tight truncate">{method.name}</span>
                  </button>
                ))}
             </div>

             {/* Botão Concluir */}
             <button 
               onClick={handleCheckout}
               disabled={checkoutLoading || cart.length === 0}
               className="w-full bg-orange-500 hover:brightness-110 text-white py-5 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-[0_0_20px_rgba(249,115,22,0.3)] rounded-none"
             >
               {checkoutLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
               {checkoutLoading ? "Processando..." : "Confirmar Recebimento"}
             </button>
         </div>
      </div>

      {/* MODAL MÁQUINA DE CAIXA */}
      {isCashierModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 min-h-screen">
          <div className="bg-white w-full max-w-sm rounded-none shadow-2xl p-6 border-t-4 border-orange-500 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
              {cashierAction === "OPEN" ? "Abrir Caixa" : "Fechar Caixa"}
            </h2>
            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed">
              {cashierAction === "OPEN" 
                ? "Inicie o turno de trabalho para registrar vendas." 
                : "Encerre o turno. O total de vendas será computado no dashboard."}
            </p>

            {cashierAction === "OPEN" && (
              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Fundo de Caixa Inicial (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full border-2 border-slate-200 pl-10 pr-4 py-3 font-black text-slate-800 outline-none focus:border-orange-500 rounded-none transition-all"
                    placeholder="0.00"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button 
                onClick={() => setIsCashierModalOpen(false)}
                className="py-3 font-black uppercase text-[10px] tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all rounded-none"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCashierAction}
                disabled={loading}
                className="py-3 font-black uppercase text-[10px] tracking-widest text-white bg-orange-500 hover:brightness-110 transition-all rounded-none flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : null}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELEÇÃO DE VARIANTE */}
      {selectedProductForVariant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-none shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 flex justify-between items-center text-white shrink-0">
               <div>
                  <h2 className="font-black uppercase tracking-tight text-lg leading-tight">{selectedProductForVariant.name}</h2>
                  <p className="text-orange-500 font-black text-sm mt-1 mb-1">R$ {selectedProductForVariant.price.toFixed(2).replace('.', ',')}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selecione uma cor e tamanho</p>
               </div>
               <button onClick={() => setSelectedProductForVariant(null)} className="p-2 bg-white/10 hover:bg-white/20 text-white transition-all">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
               {selectedProductForVariant.variants.map((v: any) => (
                 <div key={v.id} className="bg-white border border-slate-200 p-5 shadow-sm">
                   <div className="flex items-center gap-4 mb-4">
                      {v.imageUrl ? (
                        <img src={v.imageUrl} className="w-12 h-12 object-cover border border-slate-100" />
                      ) : (
                        <div className="w-12 h-12 border border-slate-200 flex shrink-0" style={{ backgroundColor: v.colorHex }} />
                      )}
                      <div>
                        <h4 className="font-black text-slate-800 uppercase text-sm">{v.color}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                           Cod Barras: {v.barcode || 'N/A'} &bull; Estoque: {v.stock}
                        </p>
                      </div>
                   </div>

                   <div>
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Tamanhos</p>
                     <div className="flex flex-wrap gap-2">
                        {v.sizes.map((s: string) => (
                          <button
                            key={s}
                            onClick={() => {
                              addToCart(selectedProductForVariant, v, s);
                              setSelectedProductForVariant(null);
                            }}
                            className="w-12 h-12 border-2 border-slate-200 font-black uppercase text-sm text-slate-700 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center shrink-0"
                          >
                            {s}
                          </button>
                        ))}
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
