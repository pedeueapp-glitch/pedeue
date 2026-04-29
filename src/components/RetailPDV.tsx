"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ShoppingBag, Search, Plus, Minus, Trash2, 
  CreditCard, Banknote, Smartphone, User, Loader2, Barcode,
  AlertCircle, Package, Receipt, LogOut, Menu, CheckCircle2, X,
  ClipboardList, Calendar, DollarSign, TrendingUp, Eye, ChevronDown, Percent
} from "lucide-react";
import toast from "react-hot-toast";
import { useSidebar } from "@/lib/contexts/SidebarContext";

interface RetailPDVProps {
  storeId: string;
}

export default function RetailPDV({ storeId }: RetailPDVProps) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [cashier, setCashier] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  
  const { toggle } = useSidebar();

  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CARTAO DE CREDITO");
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Desconto
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");

  // Troco
  const [cashReceived, setCashReceived] = useState("");

  // Controle de Caixa
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [cashierAction, setCashierAction] = useState<"OPEN" | "CLOSE">("OPEN");
  const [openingBalance, setOpeningBalance] = useState("0");

  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any>(null);

  // Vendas
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [salesFilter, setSalesFilter] = useState<"today" | "all">("today");
  const [salesData, setSalesData] = useState<any>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  // Mobile
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReport, setCloseReport] = useState<any>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);


  useEffect(() => {
    fetchData();
    setTimeout(() => barcodeInputRef.current?.focus(), 500);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/pdv/retail");
      const data = await res.json();
      setProducts(data.products || []);
      setCashier(data.cashier);
      setStore(data.store);
    } catch {
      toast.error("Erro ao sincronizar PDV");
    } finally {
      setLoading(false);
    }
  }

  // --- BUSCA POR CODIGO DE BARRAS OU NOME ---
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    let foundMatch = false;

    for (const prod of products) {
      // 1. Barcode do produto principal (sem variantes)
      if (prod.barcode && prod.barcode.toLowerCase() === query) {
        const hasVariants = prod.variants && prod.variants.length > 0;
        if (hasVariants) {
          // Produto com variantes encontrado pelo barcode do produto -> abre modal
          setSelectedProductForVariant(prod);
          foundMatch = true;
          break;
        } else {
          // Produto sem variantes -> adiciona direto
          addToCart(prod, null, "");
          foundMatch = true;
          break;
        }
      }

      // 2. Barcode de uma variante especifica -> adiciona direto
      if (prod.variants) {
        for (const variant of prod.variants) {
          if (variant.barcode && variant.barcode.toLowerCase() === query) {
            addToCart(prod, variant, variant.sizes.length > 0 ? variant.sizes[0] : "");
            foundMatch = true;
            break;
          }
        }
      }
      if (foundMatch) break;

      // 3. Busca por nome
      if (prod.name.toLowerCase().includes(query)) {
        const hasVariants = prod.variants && prod.variants.length > 0;
        if (hasVariants) {
          setSelectedProductForVariant(prod);
        } else {
          addToCart(prod, null, "");
        }
        foundMatch = true;
        break;
      }
    }

    if (!foundMatch) {
       toast.error("Produto nao encontrado.");
    }
    setSearchQuery("");
    barcodeInputRef.current?.focus();
  }

  function addToCart(product: any, variant: any = null, size: string = "") {
    if (product.variants && product.variants.length > 0 && !variant) {
       setSelectedProductForVariant(product);
       return;
    }

    const cartId = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const variantText = variant ? `Cor: ${variant.color} | Tam: ${size}` : "";

    setCart(prev => [...prev, {
      id: cartId,
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      variantText,
      price: product.salePrice || product.price,
      qty: 1
    }]);

    toast.success("Item adicionado");
    barcodeInputRef.current?.focus();
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

  // Calculo do desconto
  const discountNum = parseFloat(discountValue) || 0;
  const discountAmount = discountType === "percent" 
    ? (subtotal * Math.min(discountNum, 100)) / 100 
    : Math.min(discountNum, subtotal);
  
  // Calculo do Acrescimo de Cartao
  let cardSurcharge = 0;
  const surchargeType = store?.cardSurchargeType || "PERCENT";
  if (paymentMethod === "CARTAO DE DEBITO") {
    const val = store?.debitSurchargeValue || 0;
    cardSurcharge = surchargeType === "PERCENT" ? (subtotal * (val / 100)) : val;
  } else if (paymentMethod === "CARTAO DE CREDITO") {
    const val = store?.creditSurchargeValue || 0;
    cardSurcharge = surchargeType === "PERCENT" ? (subtotal * (val / 100)) : val;
  }

  const totalFinal = Math.max(0, subtotal + cardSurcharge - discountAmount);

  // Calculo do troco
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const changeAmount = cashReceivedNum - totalFinal;

  async function handleCheckout() {
    if (cart.length === 0) return toast.error("O carrinho esta vazio.");

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
          total: totalFinal,
          cardSurcharge,
          discount: discountAmount,
          subtotal: subtotal
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Venda registrada com sucesso!", { id: toastId });
      
      // Imprimir venda
      if (data.order) {
        printReceipt(data.order);
      }

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscountValue("");
      setCashReceived("");
      barcodeInputRef.current?.focus();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar venda", { id: toastId });
    } finally {
      setCheckoutLoading(false);
    }
  }

  function printReceipt(order: any) {
    const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
    
    const html = `
      <html><head><title>Recibo #${order.id.slice(-4).toUpperCase()}</title>
      <style>
        @page { margin: 0; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 11px; width: 180px; padding: 2px; margin: 0; color: #000; }
        .text-center { text-align: center; } .bold { font-weight: bold; } .large { font-size: 14px; }
        .divisor { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; } td { padding: 2px 0; }
        .total-row { font-size: 12px; font-weight: bold; }
      </style>
      </head><body>
      <div class="text-center"><div class="bold large">${store?.name || "LOJA"}</div></div>
      <div class="divisor"></div>
      <div class="text-center bold">RECIBO DE VENDA</div>
      <div class="text-center" style="font-size: 10px;">${new Date().toLocaleString("pt-BR")}</div>
      <div class="divisor"></div>
      <div>CLIENTE: ${order.customerName || "Venda Balcão"}</div>
      <div class="divisor"></div>
      <table>
        <tr class="bold"><td>ITEM</td><td align="right">TOTAL</td></tr>
        ${order.items?.map((i: any) => `
          <tr><td>${i.quantity}x ${i.productName || 'Produto'}</td><td align="right">${fmt(i.price * i.quantity)}</td></tr>
        `).join("") || cart.map((i: any) => `
          <tr><td>${i.qty}x ${i.name}</td><td align="right">${fmt(i.price * i.qty)}</td></tr>
        `).join("")}
      </table>
      <div class="divisor"></div>
      <table>
        <tr><td>SUBTOTAL</td><td align="right">${fmt(order.subtotal || subtotal)}</td></tr>
        ${order.cardSurcharge > 0 ? `<tr><td>ACRESCIMO CARTAO</td><td align="right">${fmt(order.cardSurcharge)}</td></tr>` : ""}
        ${order.discount > 0 ? `<tr><td>DESCONTO</td><td align="right">-${fmt(order.discount)}</td></tr>` : ""}
        <tr class="total-row"><td>TOTAL</td><td align="right">${fmt(order.total)}</td></tr>
      </table>
      <div class="divisor"></div>
      <div>PAGAMENTO: ${order.paymentMethod}</div>
      <div class="divisor"></div>
      <div class="text-center" style="font-size: 10px; margin-top: 10px;">OBRIGADO PELA PREFERENCIA!</div>
      </body></html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  }


  // --- VENDAS ---
  async function fetchSales(filter: "today" | "all" = "today") {
    setSalesLoading(true);
    try {
      const res = await fetch(`/api/pdv/retail/sales?filter=${filter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSalesData(data);
    } catch (err: any) {
      toast.error("Erro ao carregar vendas");
    } finally {
      setSalesLoading(false);
    }
  }

  function openSalesPanel() {
    setIsSalesOpen(true);
    fetchSales(salesFilter);
  }

  if (loading && !isCashierModalOpen) return (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center">
      <Loader2 size={40} className="animate-spin text-purple-500 mb-4" />
      <p className="font-bold  tracking-widest text-slate-400 text-xs">Sincronizando PDV Loja...</p>
    </div>
  );

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-slate-50 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ===== LADO ESQUERDO: CATALOGO E BUSCA ===== */}
      <div className="flex-1 flex flex-col h-full min-h-0 bg-white border-r border-slate-100">
        
        {/* Header do Caixa */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#0f172a] text-white">
           <div className="flex items-center gap-3">
             <button onClick={toggle} className="lg:hidden p-2 -ml-2 text-slate-300 hover:text-white transition-all">
               <Menu size={24} />
             </button>
             <div className="bg-purple-500 p-2 rounded-none hidden lg:block">
               <Receipt size={20} />
             </div>
             <div>
               <h1 className="font-black text-lg  tracking-tight">PDV Vitrine</h1>
               <div className="flex items-center gap-2 mt-0.5">
                 <div className={`w-2 h-2 rounded-none ${cashier ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
                 <span className="text-[10px] font-bold  tracking-widest text-slate-300">
                   {cashier ? `Caixa Aberto (ID: ${cashier.id?.substring(0,8) || ''})` : "CAIXA FECHADO"}
                 </span>
               </div>
             </div>
           </div>
           
             <button 
               onClick={openSalesPanel}
               className="px-4 py-2 font-black  text-[10px] tracking-widest transition-all rounded-none border-2 border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center gap-2"
             >
               <ClipboardList size={14} />
               <span className="hidden sm:inline">Vendas</span>
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
               placeholder="Leia o Codigo de Barras (SKU) ou busque por Nome e de [ENTER]"
               className="w-full bg-white border-2 border-slate-200 focus:border-purple-500 px-14 py-5 font-black  text-sm outline-none transition-all rounded-none placeholder-slate-400"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
          </form>
        </div>

        {/* Lista de Produtos Manuais (Caso falte codigo de barras) */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-slate-50">
           <p className="text-[10px] font-black  tracking-widest text-slate-400 mb-4">Acesso Rapido - Manual</p>
           
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
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
                    className="bg-white border text-center border-slate-100 p-2 hover:border-purple-500 transition-all cursor-pointer rounded-none flex flex-col h-full group relative shadow-sm"
                  >
                     <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center bg-slate-50 overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <Package size={20} className="text-slate-300" />
                        )}
                     </div>
                     <h3 className="text-[10px] font-bold text-slate-800  line-clamp-2 leading-tight flex-1 mb-1">{product.name}</h3>
                     <div className="flex flex-col items-center">
                        {product.salePrice && product.salePrice < product.price && (
                          <span className="text-[8px] text-slate-400 line-through font-bold leading-none mb-0.5">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                        )}
                        <p className="text-purple-600 font-black text-[11px] leading-none">R$ {(product.salePrice && product.salePrice < product.price ? product.salePrice : product.price).toFixed(2).replace('.', ',')}</p>
                     </div>

                     {hasVariants && (
                       <div className="absolute top-1 right-1 bg-slate-900 text-white text-[7px] font-black px-1 py-0.5  tracking-widest">
                         +
                       </div>
                     )}
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      {/* OVERLAY PARA O CARRINHO MOBILE */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] lg:hidden backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* ===== LADO DIREITO: CARRINHO E CHECKOUT ===== */}
      <div className={`
        fixed lg:static top-0 right-0 h-full z-[100] lg:z-10
        w-full sm:w-[420px] bg-white flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.05)] border-l border-slate-200
        transition-transform duration-300
        ${isCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}>
         
         <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-black text-slate-800 tracking-tight flex items-center gap-2 text-sm">
              <ShoppingBag size={15} className="text-purple-500" /> Venda Atual
            </h2>
            <button className="lg:hidden p-2" onClick={() => setIsCartOpen(false)}>
               <X size={20} className="text-slate-400" />
            </button>
         </div>

         {/* Cliente */}
         <div className="px-4 py-3 border-b border-slate-100 space-y-2">
             <div className="flex gap-2">
               <div className="p-2 bg-slate-100 text-slate-500 rounded-none"><User size={14} /></div>
               <input 
                 className="flex-1 bg-slate-50 border border-slate-200 font-bold text-[10px]  px-3 py-1.5 outline-none focus:border-slate-400 rounded-none" 
                 placeholder="Nome do Cliente (Opcional)"
                 value={customerName}
                 onChange={e => setCustomerName(e.target.value)}
               />
             </div>
             <div className="flex gap-2">
               <div className="p-2 bg-slate-100 text-slate-500 rounded-none"><Smartphone size={14} /></div>
               <input 
                 className="flex-1 bg-slate-50 border border-slate-200 font-bold text-[10px]  px-3 py-1.5 outline-none focus:border-slate-400 rounded-none" 
                 placeholder="Telefone (Opcional)"
                 value={customerPhone}
                 onChange={e => setCustomerPhone(e.target.value)}
               />
             </div>
         </div>

         {/* Itens do Carrinho */}
         <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
             {cart.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center px-4">
                 <Barcode size={36} className="mb-3 opacity-50" />
                 <p className="font-black  text-[10px] tracking-widest leading-relaxed">Leia o codigo de barras ou adicione itens pelo painel.</p>
               </div>
             ) : (
               cart.map((item) => (
                 <div key={item.id} className="bg-white border border-slate-200 p-2.5 rounded-none group hover:border-purple-500 transition-all flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                       <h4 className="font-black text-slate-900  text-[10px] leading-tight line-clamp-1">{item.name}</h4>
                       {item.variantText && <p className="text-[8px] font-bold text-slate-400  mt-0.5">{item.variantText}</p>}
                       <p className="text-purple-600 font-black text-xs mt-0.5">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <div className="flex items-center gap-0.5 bg-slate-100 p-0.5">
                          <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-200"><Minus size={10} /></button>
                          <span className="w-6 text-center font-black text-[10px]">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-200"><Plus size={10} /></button>
                       </div>
                       <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                         <Trash2 size={13} />
                       </button>
                    </div>
                 </div>
               ))
             )}
         </div>

         {/* Pagamento e Fechamento */}
         <div className="p-4 bg-slate-900 border-t-4 border-purple-500">

             {/* Desconto */}
             <div className="mb-3">
               <p className="text-[8px] font-black  tracking-widest text-slate-500 mb-1.5">Desconto</p>
               <div className="flex gap-1.5">
                 <div className="flex border border-slate-800 rounded-none overflow-hidden">
                   <button 
                     onClick={() => setDiscountType("percent")}
                     className={`px-2 py-1.5 text-[9px] font-black transition-all ${discountType === 'percent' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                   >
                     <Percent size={11} />
                   </button>
                   <button 
                     onClick={() => setDiscountType("fixed")}
                     className={`px-2 py-1.5 text-[9px] font-black transition-all ${discountType === 'fixed' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                   >
                     R$
                   </button>
                 </div>
                 <input 
                   type="number" 
                   step="0.01" 
                   min="0"
                   placeholder={discountType === 'percent' ? 'Ex: 10' : 'Ex: 5.00'}
                   className="flex-1 bg-slate-800 border border-slate-700 text-white font-black text-xs px-3 py-1.5 outline-none focus:border-purple-500 rounded-none placeholder-slate-600"
                   value={discountValue}
                   onChange={e => setDiscountValue(e.target.value)}
                 />
               </div>
               {discountAmount > 0 && (
                 <p className="text-green-400 text-[9px] font-black  mt-1">
                   -{discountType === 'percent' ? `${discountNum}%` : ''} R$ {discountAmount.toFixed(2).replace('.', ',')}
                 </p>
               )}
             </div>
             
             {/* Total */}
             <div className="flex justify-between items-center mb-1">
                 <span className="text-[9px] font-black  tracking-widest text-slate-500">Subtotal</span>
                 <span className="text-xs font-bold text-slate-400">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
             </div>
             {discountAmount > 0 && (
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[9px] font-black  tracking-widest text-green-500">Desconto</span>
                 <span className="text-xs font-bold text-green-400">-R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
               </div>
             )}
             <div className="flex justify-between items-end mb-4">
                 <span className="text-[10px] font-black  tracking-widest text-slate-400">Total</span>
                 <span className="text-2xl font-black text-white">R$ {totalFinal.toFixed(2).replace('.', ',')}</span>
             </div>

             {/* Metodos */}
             <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  { name: "DINHEIRO", icon: Banknote, label: "Dinheiro" },
                  { name: "CARTAO DE CREDITO", icon: CreditCard, label: "Credito" },
                  { name: "CARTAO DE DEBITO", icon: CreditCard, label: "Debito" },
                  { name: "PIX", icon: Smartphone, label: "Pix" }
                ].map(method => (
                  <button 
                    key={method.name}
                    onClick={() => setPaymentMethod(method.name)}
                    className={`py-2 px-1 flex flex-col items-center gap-1 border transition-all rounded-none ${paymentMethod === method.name ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <method.icon size={14} className={paymentMethod === method.name ? 'text-purple-500' : ''} />
                    <span className="font-black  text-[7px] tracking-tight">{method.label}</span>
                  </button>
                ))}
             </div>

             {/* Troco - Apenas quando dinheiro selecionado */}
             {paymentMethod === "DINHEIRO" && (
               <div className="mb-3 p-3 bg-slate-800 border border-slate-700">
                 <p className="text-[8px] font-black  tracking-widest text-slate-500 mb-1.5">Valor Recebido</p>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">R$</span>
                   <input 
                     type="number" 
                     step="0.01" 
                     min="0"
                     placeholder="0,00"
                     className="w-full bg-slate-900 border border-slate-700 text-white font-black text-sm pl-9 pr-3 py-2 outline-none focus:border-purple-500 rounded-none placeholder-slate-700"
                     value={cashReceived}
                     onChange={e => setCashReceived(e.target.value)}
                   />
                 </div>
                 {cashReceivedNum > 0 && (
                   <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                     <span className="text-[9px] font-black  tracking-widest text-slate-400">Troco</span>
                     <span className={`text-sm font-black ${changeAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                       {changeAmount >= 0 ? `R$ ${changeAmount.toFixed(2).replace('.', ',')}` : `Faltam R$ ${Math.abs(changeAmount).toFixed(2).replace('.', ',')}`}
                     </span>
                   </div>
                 )}
               </div>
             )}

             {/* Botao Concluir */}
             <button 
               onClick={handleCheckout}
               disabled={checkoutLoading || cart.length === 0}
               className="w-full bg-purple-500 hover:brightness-110 text-white py-3 font-black  tracking-widest text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-[0_0_20px_rgba(249,115,22,0.3)] rounded-none"
             >
               {checkoutLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
               {checkoutLoading ? "Processando..." : "Confirmar Recebimento"}
             </button>
         </div>
      </div>

      {/* MODAL MAQUINA DE CAIXA */}
      {isCashierModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 min-h-screen">
          <div className="bg-white w-full max-w-sm rounded-none shadow-2xl p-6 border-t-4 border-purple-500 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900  tracking-tight mb-2">
              {cashierAction === "OPEN" ? "Abrir Caixa" : "Fechar Caixa"}
            </h2>
            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed">
              {cashierAction === "OPEN" 
                ? "Inicie o turno de trabalho para registrar vendas." 
                : "Encerre o turno. O total de vendas sera computado no dashboard."}
            </p>

            {cashierAction === "OPEN" && (
              <div className="mb-6">
                <label className="text-[10px] font-black  tracking-widest text-slate-400 block mb-2">Fundo de Caixa Inicial (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full border-2 border-slate-200 pl-10 pr-4 py-3 font-black text-slate-800 outline-none focus:border-purple-500 rounded-none transition-all"
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
                className="py-3 font-black  text-[10px] tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all rounded-none"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCashierAction}
                disabled={loading}
                className="py-3 font-black  text-[10px] tracking-widest text-white bg-purple-500 hover:brightness-110 transition-all rounded-none flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : null}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELECAO DE VARIANTE */}
      {selectedProductForVariant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-none shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 flex justify-between items-center text-white shrink-0">
               <div>
                  <h2 className="font-black  tracking-tight text-lg leading-tight">{selectedProductForVariant.name}</h2>
                  <p className="text-purple-500 font-black text-sm mt-1 mb-1">R$ {selectedProductForVariant.price.toFixed(2).replace('.', ',')}</p>
                  <p className="text-[10px] font-bold text-slate-400  tracking-widest">Selecione uma cor e tamanho</p>
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
                        <h4 className="font-black text-slate-800  text-sm">{v.color}</h4>
                        <p className="text-[9px] text-slate-400 font-bold  mt-1">
                           Cod Barras: {v.barcode || 'N/A'} &bull; Estoque: {v.stock}
                        </p>
                      </div>
                   </div>

                   <div>
                     <p className="text-[9px] font-black  text-slate-400 mb-2">Tamanhos</p>
                     <div className="flex flex-wrap gap-2">
                        {v.sizes.map((s: string) => (
                          <button
                            key={s}
                            onClick={() => {
                              addToCart(selectedProductForVariant, v, s);
                              setSelectedProductForVariant(null);
                            }}
                            className="w-12 h-12 border-2 border-slate-200 font-black  text-sm text-slate-700 hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50 transition-all flex items-center justify-center shrink-0"
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

      {/* ===== PAINEL DE VENDAS (HISTORICO) ===== */}
      {isSalesOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-none shadow-2xl flex flex-col max-h-[95vh]">
            
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-black  tracking-tight text-lg flex items-center gap-3">
                  <ClipboardList size={22} className="text-purple-500" />
                  Historico de Vendas
                </h2>
                <p className="text-[10px] font-bold text-slate-400  tracking-widest mt-1">
                  Vendas realizadas no modo Vitrine
                </p>
              </div>
              <button onClick={() => { setIsSalesOpen(false); setSelectedSale(null); }} className="p-2 bg-white/10 hover:bg-white/20 text-white transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Filtros */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
               <button 
                 onClick={() => { setSalesFilter("today"); fetchSales("today"); }}
                 className={`px-4 py-2 font-black  text-[10px] tracking-widest border-2 transition-all rounded-none flex items-center gap-2 ${salesFilter === "today" ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}
               >
                 <Calendar size={14} /> Vendas de Hoje
               </button>
               <button 
                 onClick={() => { setSalesFilter("all"); fetchSales("all"); }}
                 className={`px-4 py-2 font-black  text-[10px] tracking-widest border-2 transition-all rounded-none flex items-center gap-2 ${salesFilter === "all" ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}
               >
                 <TrendingUp size={14} /> Todas as Vendas
               </button>
            </div>

            {/* Totais */}
            {salesData && !salesLoading && (
              <div className="grid grid-cols-3 gap-4 p-4 border-b border-slate-100 bg-white shrink-0">
                <div className="p-4 bg-green-50 border border-green-100">
                  <p className="text-[9px] font-black  text-green-600 tracking-widest">Faturamento</p>
                  <p className="text-xl font-black text-green-700 mt-1">R$ {salesData.totalRevenue?.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100">
                  <p className="text-[9px] font-black  text-blue-600 tracking-widest">Total de Vendas</p>
                  <p className="text-xl font-black text-blue-700 mt-1">{salesData.totalSales}</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-100">
                  <p className="text-[9px] font-black  text-purple-600 tracking-widest">Itens Vendidos</p>
                  <p className="text-xl font-black text-purple-700 mt-1">{salesData.totalItems}</p>
                </div>
              </div>
            )}

            {/* Lista de Vendas */}
            <div className="flex-1 overflow-y-auto">
              {salesLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-purple-500 mb-4" />
                  <p className="text-xs font-black  text-slate-400 tracking-widest">Carregando vendas...</p>
                </div>
              ) : (!salesData || salesData.sales?.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <Receipt size={48} className="mb-4 opacity-50" />
                  <p className="font-black  text-xs tracking-widest">Nenhuma venda registrada</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {salesData.sales.map((sale: any) => (
                    <div key={sale.id} className="group">
                      <div 
                        onClick={() => setSelectedSale(selectedSale?.id === sale.id ? null : sale)}
                        className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-all"
                      >
                        <div className="w-10 h-10 bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                          <DollarSign size={18} className="text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-800  text-xs">{sale.customerName || "Venda Balcao"}</h4>
                            <span className="bg-green-100 text-green-700 text-[8px] font-black px-2 py-0.5  tracking-widest">{sale.status}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[9px] text-slate-400 font-bold ">
                              {new Date(sale.createdAt).toLocaleDateString('pt-BR')} as {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold ">{sale.paymentMethod}</p>
                            {sale.customerPhone && <p className="text-[9px] text-slate-400 font-bold ">Tel: {sale.customerPhone}</p>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-3">
                          <p className="font-black text-purple-600 text-lg">R$ {sale.total.toFixed(2).replace('.', ',')}</p>
                          <ChevronDown size={16} className={`text-slate-300 transition-transform ${selectedSale?.id === sale.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Detalhes dos itens da venda */}
                      {selectedSale?.id === sale.id && (
                        <div className="px-5 pb-5 bg-slate-50 border-t border-slate-100">
                          <p className="text-[9px] font-black  text-slate-400 tracking-widest mt-4 mb-3">Itens desta venda ({sale.items.length})</p>
                          <div className="space-y-2">
                            {sale.items.map((item: any) => (
                              <div key={item.id} className="bg-white p-3 border border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                  <Package size={14} className="text-slate-300" />
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
                                  <p className="font-black text-purple-600 text-xs">R$ {(item.quantity * item.price).toFixed(2).replace('.', ',')}</p>
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
        </div>
      )}

      {/* MODAL RELATORIO DE FECHAMENTO */}
      {showCloseModal && closeReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-none shadow-2xl flex flex-col max-h-[90vh] border-t-8 border-slate-900">
             <div className="p-8 overflow-y-auto no-scrollbar">
                <div className="text-center mb-8">
                   <div className="w-16 h-16 bg-slate-100 rounded-none flex items-center justify-center mx-auto mb-4">
                      <Receipt size={32} className="text-slate-900" />
                   </div>
                   <h2 className="text-2xl font-black text-slate-900  tracking-tighter">Relatório de Fechamento</h2>
                   <p className="text-[10px] font-bold text-slate-400  tracking-widest uppercase mt-2">Resumo de Vendas do Turno</p>
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 border border-slate-100 rounded-none">
                         <p className="text-[10px] font-black text-slate-400  tracking-widest mb-1 uppercase">Abertura</p>
                         <p className="text-lg font-black text-slate-900">R$ {closeReport.openingBalance.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className="p-5 bg-purple-50 border border-purple-100 rounded-none">
                         <p className="text-[10px] font-black text-purple-400  tracking-widest mb-1 uppercase">Total em Vendas</p>
                         <p className="text-lg font-black text-purple-600">R$ {closeReport.totalSales.toFixed(2).replace('.', ',')}</p>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400  tracking-widest uppercase">Meios de Pagamento</p>
                      <div className="bg-white border border-slate-100 rounded-none divide-y divide-slate-50">
                         <div className="flex justify-between items-center p-4">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-2"><Banknote size={14}/> Dinheiro</span>
                            <span className="text-sm font-black text-slate-900">R$ {closeReport.cashTotal.toFixed(2).replace('.', ',')}</span>
                         </div>
                         <div className="flex justify-between items-center p-4">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-2"><CreditCard size={14}/> Cartão</span>
                            <span className="text-sm font-black text-slate-900">R$ {closeReport.cardTotal.toFixed(2).replace('.', ',')}</span>
                         </div>
                         <div className="flex justify-between items-center p-4">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-2"><Smartphone size={14}/> PIX</span>
                            <span className="text-sm font-black text-slate-900">R$ {closeReport.pixTotal.toFixed(2).replace('.', ',')}</span>
                         </div>
                      </div>
                   </div>

                   <div className="p-5 bg-slate-900 text-white rounded-none flex justify-between items-center">
                      <div>
                         <p className="text-[10px] font-black text-slate-400  tracking-widest uppercase">Saldo Final em Caixa</p>
                         <p className="text-xs font-bold text-slate-500">Abertura + Dinheiro</p>
                      </div>
                      <p className="text-2xl font-black text-white">R$ {(closeReport.openingBalance + closeReport.cashTotal).toFixed(2).replace('.', ',')}</p>
                   </div>
                </div>

                <div className="mt-8 space-y-3">
                   <button 
                    onClick={() => {
                        const win = window.open('', '_blank');
                        if (win) {
                            win.document.write(`
                                <html>
                                    <head>
                                        <title>Relatorio de Fechamento</title>
                                        <style>
                                            @page { margin: 0; }
                                            body { font-family: 'Courier New', Courier, monospace; padding: 5px; width: 180px; font-size: 11px; line-height: 1.2; color: #000; margin: 0; }
                                            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
                                            .row { display: flex; justify-content: space-between; margin: 2px 0; }
                                            .total { border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px; font-weight: bold; font-size: 12px; }
                                            @media print { .no-print { display: none; } }
                                        </style>
                                    </head>
                                    <body>
                                        <div class="header">
                                            <h3>RELATORIO DE FECHAMENTO</h3>
                                            <p>Data: ${new Date().toLocaleString()}</p>
                                        </div>
                                        <div class="row"><span>Abertura:</span> <span>R$ ${closeReport.openingBalance.toFixed(2)}</span></div>
                                        <div class="row"><span>Vendas Totais:</span> <span>R$ ${closeReport.totalSales.toFixed(2)}</span></div>
                                        <div class="row"><span>Vendas Dinheiro:</span> <span>R$ ${closeReport.cashTotal.toFixed(2)}</span></div>
                                        <div class="row"><span>Vendas Cartao:</span> <span>R$ ${closeReport.cardTotal.toFixed(2)}</span></div>
                                        <div class="row"><span>Vendas PIX:</span> <span>R$ ${closeReport.pixTotal.toFixed(2)}</span></div>
                                        <div class="total">
                                            <div class="row"><span>SALDO FINAL CAIXA:</span> <span>R$ ${(closeReport.openingBalance + closeReport.cashTotal).toFixed(2)}</span></div>
                                        </div>
                                        <script>window.print();</script>
                                    </body>
                                </html>
                            `);
                        }
                    }}
                    className="w-full py-4 bg-slate-100 text-slate-900 rounded-none font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                   >
                      <Printer size={16} /> Imprimir Relatório
                   </button>
                   <button 
                    onClick={() => {
                        setShowCloseModal(false);
                        setShowCloseConfirm(true);
                    }}
                    className="w-full py-4 bg-red-600 text-white rounded-none font-black text-xs flex items-center justify-center gap-2 hover:bg-red-500 transition-all"
                   >
                      Confirmar Fechamento de Caixa <ChevronRight size={16} />
                   </button>
                   <button onClick={() => setShowCloseModal(false)} className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600">Voltar ao PDV</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE FECHAMENTO */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-none shadow-2xl p-8 text-center border-t-8 border-red-600">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-none flex items-center justify-center mx-auto mb-6">
                 <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900  tracking-tighter mb-2">Encerrar Turno?</h3>
              <p className="text-xs font-bold text-slate-400 leading-relaxed mb-8">Esta ação irá finalizar o caixa atual e todas as vendas serão enviadas para o histórico definitivo. Esta ação não pode ser desfeita.</p>
              
              <div className="grid grid-cols-1 gap-3">
                 <button 
                  onClick={() => handleCashierAction("CLOSE")}
                  className="w-full py-4 bg-red-600 text-white rounded-none font-black text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                 >
                    Sim, Fechar Agora
                 </button>
                 <button 
                  onClick={() => setShowCloseConfirm(false)}
                  className="w-full py-4 bg-slate-100 text-slate-500 rounded-none font-black text-xs hover:bg-slate-200 transition-all"
                 >
                    Cancelar
                 </button>
              </div>
           </div>
        </div>
      )}


    </div>
  );
}
