"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingBag, Search, User, Calendar, 
  Trash2, Plus, X, Loader2, FileText, Download,
  Tag, CreditCard, Banknote, Smartphone, Printer, CheckCircle2,
  Menu
} from "lucide-react";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ServicePDV({ storeId }: { storeId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  
  // PDV State
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [deadline, setDeadline] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("DINHEIRO");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const { toggle } = useSidebar();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cashier, setCashier] = useState<any>(null);
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [cashierAction, setCashierAction] = useState<"OPEN" | "CLOSE">("OPEN");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReport, setCloseReport] = useState<any>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);


  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, custRes, storeRes, pdvRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/customers"),
        fetch("/api/store"),
        fetch("/api/pdv/settings")
      ]);
      setProducts(await prodRes.json());
      setCustomers(await custRes.json());
      setStore(await storeRes.json());
      const pdvData = await pdvRes.json();
      setCashier(pdvData.cashier);
    } catch { toast.error("Erro ao carregar dados"); } finally { setLoading(false); }
  };


  useEffect(() => { fetchData(); }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, price: product.salePrice || product.price, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const total = Math.max(0, subtotal - parseFloat(discount || "0"));

  const handleFinish = async () => {
    if (!cashier) return toast.error("Abra o caixa antes de realizar vendas.");
    if (!selectedCustomer) return toast.error("Selecione um cliente");
    if (cart.length === 0) return toast.error("O carrinho está vazio");
    if (!deadline) return toast.error("Defina o prazo de entrega");


    setSaving(true);
    try {
      const res = await fetch("/api/orders/internal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerPhone: selectedCustomer.phone,
          items: cart.map(i => ({
            productId: i.id,
            productName: i.name,
            price: i.price,
            quantity: i.quantity
          })),
          total: total,
          subtotal: subtotal,
          discount: parseFloat(discount),
          paymentMethod: paymentMethod,
          deliveryDeadline: new Date(deadline).toISOString(),
          orderType: "SERVICE"
        })
      });

      if (!res.ok) throw new Error();
      toast.success("Pedido/Orçamento gerado!");
      setCart([]);
      setSelectedCustomer(null);
      setDeadline("");
      setDiscount("0");
    } catch {
      toast.error("Erro ao salvar pedido");
    } finally {
      setSaving(false);
    }
  };

  async function handleCashierAction(action?: "OPEN" | "CLOSE" | "PREVIEW") {
    const currentAction = action || cashierAction;
    setSaving(true);
    try {
      const res = await fetch("/api/pdv/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: currentAction,
          openingBalance: parseFloat(openingBalance || "0")
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Erro ao gerenciar caixa");
        return;
      }

      if (currentAction === "PREVIEW") {
        setCloseReport(data.report);
        setShowCloseModal(true);
        return;
      }

      if (currentAction === "OPEN") {
        setCashier(data.cashier);
        toast.success("Caixa aberto!");
        setIsCashierModalOpen(false);
      } else {
        setCashier(null);
        toast.success("Caixa fechado!");
        setShowCloseConfirm(false);
        setCloseReport(null);
        setShowCloseModal(false);
        setIsCashierModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro no caixa");
    } finally {
      setSaving(false);
      fetchData();
    }
  }


  const generatePDF = async () => {
    if (!selectedCustomer) return toast.error("Selecione um cliente para gerar o PDF");
    if (cart.length === 0) return toast.error("Adicione itens para gerar o orçamento");

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
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, currentY + 10);
    doc.text(`Prazo de Entrega: ${deadline ? new Date(deadline).toLocaleDateString('pt-BR') : "A combinar"}`, 20, currentY + 15);

    // Cliente
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Cliente:", 20, currentY + 30);
    doc.setFontSize(10);
    doc.text(selectedCustomer.name, 20, currentY + 37);
    doc.text(selectedCustomer.phone, 20, currentY + 42);
    if (selectedCustomer.street) {
        doc.text(`${selectedCustomer.street}, ${selectedCustomer.number} - ${selectedCustomer.neighborhood}`, 20, currentY + 47);
    }

    // Tabela de Itens
    const tableData = cart.map(i => [
        i.name,
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
    doc.text(`Subtotal: R$ ${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`Desconto: R$ ${parseFloat(discount).toFixed(2)}`, 140, finalY + 7);
    doc.setFontSize(14);
    doc.text(`TOTAL: R$ ${total.toFixed(2)}`, 140, finalY + 17);

    doc.save(`Orcamento_${selectedCustomer.name.replace(/\s+/g, '_')}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch));

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" /></div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden relative">
      
      {/* HEADER PDV SERVICE */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 bg-[#0f172a] text-white shrink-0">
        <div className="flex items-center gap-2 lg:gap-3">
          <button 
            onClick={toggle}
            className="p-2 -ml-2 text-slate-400 hover:text-white lg:hidden transition-all"
          >
            <Menu size={20} />
          </button>
          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <ShoppingBag size={16} className="text-white" />
          </div>
          <div>
            <span className="font-black text-sm tracking-widest hidden sm:inline-block">PDV Serviços</span>
            <span className="font-black text-sm tracking-widest sm:hidden">Serviços</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${cashier ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                {cashier ? `Caixa Aberto` : 'Caixa Fechado'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
                if (cashier) {
                    handleCashierAction("PREVIEW");
                } else {
                    setCashierAction("OPEN");
                    setIsCashierModalOpen(true);
                }
            }}
            className={`px-3 py-1.5 lg:px-4 lg:py-2 font-black text-[9px] lg:text-[10px] tracking-widest transition-all rounded-lg border-2 ${cashier ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-green-500 text-green-400 hover:bg-green-500/10'}`}
          >
            {cashier ? "Fechar Caixa" : "Abrir Caixa"}
          </button>
        </div>

      </div>

      <div className="flex-1 flex flex-col lg:flex-row h-full min-h-0 overflow-hidden">
        
        {/* PAINEL ESQUERDO: PRODUTOS E CLIENTES */}
        <div className="flex-1 flex flex-col h-full min-h-0 p-2 lg:p-6 overflow-hidden">
        
        {/* BUSCA DE PRODUTOS */}
        <div className="mb-3 lg:mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            className="input-field pl-11 !py-2.5 bg-white text-xs lg:text-sm" 
            placeholder="Pesquisar produtos..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8 gap-1 lg:gap-2 pb-32 lg:pb-10 no-scrollbar">
          {filteredProducts.map(p => (
            <button 
              key={p.id} 
              onClick={() => addToCart(p)}
              className="bg-white border border-slate-100 p-1 lg:p-2 hover:border-purple-500 transition-all group flex flex-col items-center text-center shadow-sm rounded-lg"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-slate-50 rounded-lg overflow-hidden mb-1 flex items-center justify-center">
                 {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <ShoppingBag size={14} className="text-slate-300" />}
              </div>
              <div className="w-full">
                <h4 className="text-[8px] lg:text-[10px] font-bold text-navy line-clamp-1">{p.name}</h4>
                <div className="flex flex-col items-center mt-0.5">
                  <p className="text-[9px] lg:text-[11px] font-black text-purple-500 leading-none">R$ {(p.salePrice && p.salePrice < p.price ? p.salePrice : p.price).toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* OVERLAY PARA O CARRINHO MOBILE */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] lg:hidden backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* PAINEL DIREITO: CARRINHO E CHECKOUT */}
      <div className={`
        fixed lg:relative top-0 bottom-0 left-0 right-0 lg:w-[400px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shadow-2xl z-[120] lg:z-[60]
        h-full lg:h-auto transition-transform duration-300
        ${isCartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"}
      `}>
        
        {/* CABEÇALHO MOBILE */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-white">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 text-white rounded-lg"><ShoppingBag size={18} /></div>
              <h3 className="font-black text-navy text-sm">Meu Orçamento</h3>
           </div>
           <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400"><X size={20}/></button>
        </div>
        
        {/* SELEÇÃO DE CLIENTE */}
        <div className="p-3 lg:p-6 border-b border-slate-100">
           <label className="text-[8px] lg:text-[10px] font-black text-slate-400  tracking-widest mb-1.5 lg:mb-3 block">Cliente</label>
           
           {selectedCustomer ? (
              <div className="flex items-center justify-between bg-purple-50 border border-purple-100 p-2 lg:p-4 rounded-xl animate-in slide-in-from-top-2">
                 <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-7 h-7 lg:w-10 lg:h-10 bg-purple-500 text-white rounded-lg flex items-center justify-center">
                       <User size={14} />
                    </div>
                    <div>
                       <h5 className="text-[10px] lg:text-sm font-bold text-navy">{selectedCustomer.name}</h5>
                       <p className="text-[8px] lg:text-[10px] text-purple-600 font-bold">{selectedCustomer.phone}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCustomer(null)} className="p-1.5 text-purple-300 hover:text-red-500 transition-colors">
                    <X size={14} />
                 </button>
              </div>
           ) : (
              <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                 <input 
                   className="input-field pl-9 !py-2 bg-slate-50 border-none text-[10px]" 
                   placeholder="Buscar cliente..."
                   value={customerSearch}
                   onChange={e => setCustomerSearch(e.target.value)}
                 />
                
                 {customerSearch && filteredCustomers.length > 0 && (
                   <div className="absolute bottom-full lg:top-full left-0 right-0 mb-2 lg:mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto">
                     {filteredCustomers.map(c => (
                       <button 
                         key={c.id} 
                         onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}
                         className="w-full p-2.5 text-left hover:bg-slate-50 flex items-center justify-between group border-b last:border-0"
                       >
                          <div>
                             <p className="text-[10px] font-bold text-navy">{c.name}</p>
                             <p className="text-[8px] text-slate-400">{c.phone}</p>
                          </div>
                          <Plus size={12} className="text-slate-200 group-hover:text-purple-500" />
                       </button>
                     ))}
                   </div>
                 )}
              </div>
           )}
        </div>

        {/* CARRINHO */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-2 lg:space-y-4 no-scrollbar">
           {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-6 lg:py-0">
                <ShoppingBag size={32} className="text-slate-400 mb-2" />
                <p className="text-[8px] lg:text-sm font-bold text-slate-500  tracking-widest">Vazio</p>
             </div>
           ) : (
             cart.map(item => (
               <div key={item.id} className="flex gap-2 lg:gap-4 group items-center">
                  <div className="w-8 h-8 lg:w-16 lg:h-16 bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                    {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[9px] lg:text-[11px] font-bold text-navy line-clamp-1">{item.name}</h5>
                    <div className="flex items-center justify-between mt-0.5 lg:mt-2">
                       <div className="flex items-center gap-1.5 lg:gap-3 bg-slate-50 rounded-lg p-0.5 lg:p-1 border border-slate-100">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-4 h-4 lg:w-6 lg:h-6 flex items-center justify-center text-slate-400 hover:text-navy hover:bg-white rounded transition-all text-xs">-</button>
                          <span className="text-[9px] lg:text-xs font-black text-navy w-3 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-4 h-4 lg:w-6 lg:h-6 flex items-center justify-center text-slate-400 hover:text-navy hover:bg-white rounded transition-all text-xs">+</button>
                       </div>
                       <span className="text-[9px] lg:text-xs font-black text-navy">R$ {(item.price * item.quantity).toFixed(2)}</span>
                       <button onClick={() => removeFromCart(item.id)} className="p-1 text-slate-200 hover:text-red-500 transition-colors">
                          <Trash2 size={12} />
                       </button>
                    </div>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* FOOTER: PRAZO, DESCONTO, TOTAL */}
        <div className="p-4 lg:p-8 bg-slate-50 space-y-3 lg:space-y-5 pb-24 lg:pb-8">
           
           <div className="grid grid-cols-2 gap-2 lg:gap-4">
              <div className="space-y-1 lg:space-y-2">
                 <label className="text-[7px] lg:text-[9px] font-black text-slate-400  tracking-widest flex items-center gap-1">
                    <Calendar size={8} /> Prazo
                 </label>
                 <input 
                  type="datetime-local" 
                  className="input-field !py-1.5 !text-[9px] lg:!text-[11px] bg-white border-none" 
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                 />
              </div>
              <div className="space-y-1 lg:space-y-2">
                 <label className="text-[7px] lg:text-[9px] font-black text-slate-400  tracking-widest flex items-center gap-1">
                    <Tag size={8} /> Desconto
                 </label>
                 <input 
                  type="number" 
                  className="input-field !py-1.5 !text-[9px] lg:!text-[11px] bg-white border-none" 
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                 />
              </div>
           </div>

           <div className="grid grid-cols-3 gap-1 lg:gap-2">
              {[
                { id: "DINHEIRO", icon: Banknote, label: "Dinheiro" },
                { id: "CARTAO", icon: CreditCard, label: "Cartão" },
                { id: "PIX", icon: Smartphone, label: "Pix" }
              ].map(m => (
                <button 
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex flex-col items-center justify-center p-1.5 lg:p-3 rounded-lg lg:rounded-2xl border transition-all ${paymentMethod === m.id ? 'bg-navy border-navy text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                >
                   <m.icon size={12} className="mb-0.5 lg:mb-1.5" />
                   <span className="text-[6px] lg:text-[8px] font-black ">{m.label}</span>
                </button>
              ))}
           </div>

           <div className="pt-2 lg:pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center mb-2 lg:mb-6">
                 <span className="text-[8px] lg:text-xs font-bold text-slate-500  tracking-widest">Total</span>
                 <span className="text-base lg:text-2xl font-black text-navy">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                 <button 
                  onClick={generatePDF}
                  className="w-full py-2 lg:py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-lg lg:rounded-2xl font-black  text-[8px] lg:text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
                 >
                    <Download size={14} /> Baixar PDF
                 </button>
                 <button 
                  onClick={handleFinish}
                  disabled={saving}
                  className="w-full py-2 lg:py-4 bg-purple-500 text-white rounded-lg lg:rounded-2xl font-black  text-[8px] lg:text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20 hover:bg-purple-600 transition-all disabled:opacity-50"
                 >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                    Finalizar
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* BOTAO FLUTUANTE CARRINHO MOBILE */}
      {!isCartOpen && (
        <div className="fixed bottom-24 left-4 right-4 lg:hidden z-40">
           <button 
             onClick={() => setIsCartOpen(true)}
             className="w-full bg-slate-900 text-white flex items-center justify-between px-6 py-4 rounded-2xl shadow-2xl border border-slate-800"
           >
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-purple-500 text-white flex items-center justify-center rounded-full font-black text-xs">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                 </div>
                 <span className="font-black tracking-widest text-xs">Ver Orçamento</span>
              </div>
              <span className="font-black text-purple-400 text-lg">R$ {total.toFixed(2).replace('.', ',')}</span>
           </button>
        </div>
      )}

      </div>

      {/* MODAL CAIXA */}
      {isCashierModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border-t-4 border-purple-500">
            <h2 className="text-xl font-black text-navy tracking-tight mb-2">Abrir Caixa</h2>
            <p className="text-xs font-bold text-slate-400 mb-6">Inicie o turno para registrar orçamentos e serviços.</p>
            <div className="mb-6">
              <label className="text-[10px] font-black tracking-widest text-slate-400 block mb-2 uppercase">Fundo de Caixa Inicial</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                <input 
                  type="number"
                  className="w-full border-2 border-slate-100 pl-10 pr-4 py-3 font-black text-navy outline-none focus:border-purple-500 rounded-xl"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setIsCashierModalOpen(false)} className="py-3 font-black text-[10px] tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl">Cancelar</button>
              <button onClick={() => handleCashierAction("OPEN")} className="py-3 font-black text-[10px] tracking-widest text-white bg-purple-500 hover:bg-purple-600 rounded-xl">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RELATORIO DE FECHAMENTO */}
      {showCloseModal && closeReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border-t-8 border-navy">
             <div className="p-8 overflow-y-auto no-scrollbar">
                <div className="text-center mb-8">
                   <h2 className="text-2xl font-black text-navy tracking-tighter">Relatório de Fechamento</h2>
                   <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-2">Resumo de Serviços do Turno</p>
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl">
                         <p className="text-[10px] font-black text-slate-400 tracking-widest mb-1 uppercase">Abertura</p>
                         <p className="text-lg font-black text-navy">R$ {closeReport.openingBalance.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className="p-5 bg-purple-50 border border-purple-100 rounded-xl">
                         <p className="text-[10px] font-black text-purple-400 tracking-widest mb-1 uppercase">Total de Serviços</p>
                         <p className="text-lg font-black text-purple-600">R$ {closeReport.totalSales.toFixed(2).replace('.', ',')}</p>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Pagamentos Recebidos</p>
                      <div className="bg-white border border-slate-100 rounded-xl divide-y divide-slate-50">
                         <div className="flex justify-between items-center p-4">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-2"><Banknote size={14}/> Dinheiro</span>
                            <span className="text-sm font-black text-navy">R$ {closeReport.cashTotal.toFixed(2).replace('.', ',')}</span>
                         </div>
                         <div className="flex justify-between items-center p-4">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-2"><CreditCard size={14}/> Cartão</span>
                            <span className="text-sm font-black text-navy">R$ {closeReport.cardTotal.toFixed(2).replace('.', ',')}</span>
                         </div>
                         <div className="flex justify-between items-center p-4">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-2"><Smartphone size={14}/> PIX</span>
                            <span className="text-sm font-black text-navy">R$ {closeReport.pixTotal.toFixed(2).replace('.', ',')}</span>
                         </div>
                      </div>
                   </div>

                   <div className="p-5 bg-navy text-white rounded-xl flex justify-between items-center">
                      <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Saldo Final Estimado</p>
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
                                        <title>Relatorio PDV Servicos</title>
                                        <style>body { font-family: sans-serif; padding: 40px; line-height: 1.6; }</style>
                                    </head>
                                    <body>
                                        <h1>RELATÓRIO DE FECHAMENTO - SERVIÇOS</h1>
                                        <p>Data: ${new Date().toLocaleString()}</p>
                                        <hr/>
                                        <p>Abertura: R$ ${closeReport.openingBalance.toFixed(2)}</p>
                                        <p>Vendas Totais: R$ ${closeReport.totalSales.toFixed(2)}</p>
                                        <p>Dinheiro: R$ ${closeReport.cashTotal.toFixed(2)}</p>
                                        <p>Cartão: R$ ${closeReport.cardTotal.toFixed(2)}</p>
                                        <p>PIX: R$ ${closeReport.pixTotal.toFixed(2)}</p>
                                        <h2>Saldo Final: R$ ${(closeReport.openingBalance + closeReport.cashTotal).toFixed(2)}</h2>
                                        <script>window.print();</script>
                                    </body>
                                </html>
                            `);
                        }
                    }}
                    className="w-full py-4 bg-slate-100 text-navy rounded-xl font-black text-xs flex items-center justify-center gap-2"
                   >
                      <Printer size={16} /> Imprimir Relatório
                   </button>
                   <button 
                    onClick={() => {
                        setShowCloseModal(false);
                        setShowCloseConfirm(true);
                    }}
                    className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2"
                   >
                      Confirmar Fechamento <ChevronRight size={16} />
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DEFINITIVA */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-2xl p-8 text-center border-t-8 border-red-600">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-navy tracking-tighter mb-2">Encerrar Turno?</h3>
              <p className="text-xs font-bold text-slate-400 mb-8">Esta ação não pode ser desfeita.</p>
              <div className="grid grid-cols-1 gap-3">
                 <button onClick={() => handleCashierAction("CLOSE")} className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-xs">Sim, Fechar Agora</button>
                 <button onClick={() => setShowCloseConfirm(false)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-xs">Cancelar</button>
              </div>
           </div>
        </div>
      )}

    </div>

  );
}
