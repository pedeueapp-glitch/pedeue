"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  ShoppingBag, Clock, CheckCircle2, Truck, XCircle, Printer, Search,
  ChevronLeft, X, CreditCard, Banknote, Smartphone, Trash2, Plus,
  PlusCircle, Hash, User, MapPin, Loader2, AlertCircle, Bike,
  Volume2, VolumeX, Navigation, Bell, Settings, Package, ChevronRight, Layers, RotateCcw,
  Receipt, Barcode, ScrollText
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { PlanGate } from "@/components/PlanGate";
import { hasFeature } from "@/lib/permissions";
import { Lock } from "lucide-react";

const STATUS_CONFIG: any = {
  PENDING:   { label: "Pendente",   color: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-200", icon: Clock,         next: "PREPARING",  prev: null },
  PREPARING: { label: "Em Preparo", color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200",   icon: Loader2,       next: "DELIVERING", prev: "PENDING" },
  DELIVERING:{ label: "Em Rota",    color: "text-purple-600", bg: "bg-purple-50",  border: "border-purple-200", icon: Truck,         next: "DELIVERED",  prev: "PREPARING" },
  DELIVERED: { label: "Entregue",   color: "text-green-600",  bg: "bg-green-50",   border: "border-green-200",  icon: CheckCircle2,  next: null,         prev: "DELIVERING" },
  DONE:      { label: "Concluído",  color: "text-green-600",  bg: "bg-green-50",   border: "border-green-200",  icon: CheckCircle2,  next: null,         prev: null },
  CANCELED:  { label: "Cancelado",  color: "text-red-600",    bg: "bg-red-50",     border: "border-red-200",    icon: XCircle,       next: null,         prev: null },
};

const TAB_FILTERS = [
  { id: "ALL",      label: "Todos" },
  { id: "DINING_IN",label: "Mesas" },
  { id: "DELIVERY", label: "Delivery" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ===== COMPONENTE PRINCIPAL =====
interface PDVComponentProps {
  fullscreen?: boolean;
}

export default function PDVComponent({ fullscreen = false }: PDVComponentProps) {
  // Dados
  const [orders, setOrders]       = useState<any[]>([]);
  const [drivers, setDrivers]     = useState<any[]>([]);
  const [tables, setTables]       = useState<any[]>([]);
  const [waiters, setWaiters]     = useState<any[]>([]);
  const [products, setProducts]   = useState<any[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [loading, setLoading]     = useState(true);

  // Caixa
  const [cashier, setCashier]           = useState<any>(null);
  const [cashierLoading, setCashierLoading] = useState(true);
  const [isToday, setIsToday]           = useState(false);
  const [openingBalance, setOpeningBalance] = useState("0");
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // PDV
  const [tabFilter, setTabFilter]       = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE"); // ACTIVE | DONE | ALL
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [closingPaymentMethod, setClosingPaymentMethod] = useState("DINHEIRO");
  const [searchOrder, setSearchOrder]   = useState("");

  // Modal: detalhes do pedido (somente leitura)
  const [detailOrder, setDetailOrder]   = useState<any>(null);

  // Modal: Nova comanda de Mesa
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [internalCart, setInternalCart]   = useState<any[]>([]);
  const [internalOrder, setInternalOrder] = useState({ tableId: "", waiterId: "", customerName: "Consumo Local" });
  const [searchProduct, setSearchProduct] = useState("");
  
  // Checkout (Fechamento)
  const [checkoutOrder, setCheckoutOrder] = useState<any>(null);
  const [discountValue, setDiscountValue] = useState("0");
  const [discountType, setDiscountType]   = useState<"FIXED" | "PERCENT">("FIXED");

  // Opcionais de Produtos
  const [selectedProductForOptions, setSelectedProductForOptions] = useState<any>(null);
  const [productOptionsSelection, setProductOptionsSelection] = useState<any>({});

  // Configurações PDV
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPrint, setAutoPrint]       = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const prevOrdersRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ---- FETCH ----
  const fetchData = useCallback(async () => {
    try {
      const [resOrders, resDrivers, resTables, resWaiters, resProducts] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/drivers"),
        fetch("/api/tables"),
        fetch("/api/waiters"),
        fetch("/api/products"),
      ]);
      const [ordData, drData, tbData, waData, prData] = await Promise.all([
        resOrders.json(), resDrivers.json(), resTables.json(), resWaiters.json(), resProducts.json()
      ]);
      
      if (Array.isArray(ordData)) {
        const newIds = ordData.map((o: any) => o.id);
        const added  = newIds.filter(id => !prevOrdersRef.current.includes(id));
        
        if (added.length > 0 && prevOrdersRef.current.length > 0) {
          playNotification();
          if (autoPrint) {
            added.forEach(id => {
              const order = ordData.find((o: any) => o.id === id);
              if (order && order.orderType === "DELIVERY") autoPrintOrder(order);
            });
          }
        }
        prevOrdersRef.current = newIds;
        setOrders(ordData);
      }
      if (Array.isArray(drData)) setDrivers(drData);
      if (Array.isArray(tbData)) setTables(tbData);
      if (Array.isArray(waData)) setWaiters(waData);
      if (Array.isArray(prData)) setProducts(prData);

      const resStore = await fetch("/api/store");
      if (resStore.ok) setStoreInfo(await resStore.json());
    } catch (e) {
      console.error("Erro ao carregar PDV:", e);
    } finally {
      setLoading(false);
    }
  }, [autoPrint]);

  const fetchCashier = async () => {
    try {
      const res  = await fetch("/api/pdv/cashier");
      const data = await res.json();
      setCashier(data.cashier);
      setIsToday(data.isToday ?? false);
    } catch (e) { console.error(e); }
    finally { setCashierLoading(false); }
  };

  const fetchSettings = async () => {
    try {
      const res  = await fetch("/api/pdv/settings");
      const data = await res.json();
      setSoundEnabled(data.soundEnabled ?? true);
      setAutoPrint(data.autoPrint ?? false);
    } catch (e) { /* usa defaults */ }
  };

  const saveSettings = async (sound: boolean, print: boolean) => {
    try {
      await fetch("/api/pdv/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soundEnabled: sound, autoPrint: print })
      });
      toast.success("Configurações salvas!");
    } catch (e) { toast.error("Erro ao salvar"); }
  };

  useEffect(() => {
    fetchCashier();
    fetchSettings();
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ---- NOTIFICAÇÃO ----
  const playNotification = () => {
    if (!soundEnabled) return;
    try {
      const audio = audioRef.current || new Audio("/sounds/notification.mp3");
      audioRef.current = audio;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const autoPrintOrder = (order: any) => {
    // Abre uma janela de impressão invisível
    const printWindow = window.open("", "_blank", "width=300,height=600");
    if (!printWindow) return;
    printWindow.document.write(buildReceiptHTML(order));
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); printWindow.close(); };
  };

  const buildReceiptHTML = (order: any) => `
    <html><head><title>Comanda #${order.orderNumber || order.id.slice(-4).toUpperCase()}</title>
    <style>body{font-family:monospace;font-size:12px;width:280px;padding:12px}h2{text-align:center}table{width:100%}td{padding:2px 0}.total{font-weight:bold;font-size:14px}.divisor{border-top:1px dashed #000;margin:6px 0}</style>
    </head><body>
    <h2>COMANDA #${order.orderNumber || order.id.slice(-4).toUpperCase()}</h2>
    <p>${order.orderType === "DINING_IN" ? `Mesa: ${order.table?.number || "?"} | Garçom: ${order.waiter?.name || "?"}` : `Tipo: ${order.deliveryType}`}</p>
    <p>Cliente: ${order.customerName}</p>
    <div class="divisor"></div>
    <table>${order.items?.map((i: any) => `<tr><td>${i.quantity}x ${i.productName || i.product?.name}</td><td align="right">${formatCurrency(i.price * i.quantity)}</td></tr>`).join("") || ""}</table>
    <div class="divisor"></div>
    <table><tr><td class="total">TOTAL</td><td class="total" align="right">${formatCurrency(order.total)}</td></tr></table>
    <p>Forma: ${order.paymentMethod}</p>
    <p style="text-align:center;margin-top:10px">${new Date().toLocaleString("pt-BR")}</p>
    </body></html>
  `;

  // ---- CAIXA ----
  const manageCashier = async (action: "OPEN" | "CLOSE") => {
    setCashierLoading(true);
    try {
      const res  = await fetch("/api/pdv/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, openingBalance: parseFloat(openingBalance) || 0 }),
      });
      const data = await res.json();
      setCashier(data.cashier);
      if (action === "OPEN") { setIsToday(true); toast.success("Caixa aberto!"); setShowOpenModal(false); }
      else { toast.success("Caixa fechado!"); setShowCloseModal(false); }
    } catch (e) {
      toast.error("Erro ao gerenciar caixa");
    } finally { setCashierLoading(false); }
  };

  // ---- STATUS PEDIDO ----
  const updateStatus = async (orderId: string, newStatus: string, extraData: any = {}) => {
    try {
      const body: any = { status: newStatus, ...extraData };
      if (newStatus === "DELIVERING" && selectedDriverId) body.driverId = selectedDriverId;
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(`Status: ${STATUS_CONFIG[newStatus]?.label}`);
      fetchData();
      if (selectedOrder?.id === orderId) setSelectedOrder((prev: any) => ({ ...prev, status: newStatus, ...extraData }));
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const finalizeCheckout = async () => {
    if (!checkoutOrder) return;
    try {
      setLoading(true);
      const discountAmount = discountType === "FIXED" 
        ? parseFloat(discountValue) || 0 
        : (checkoutOrder.total * (parseFloat(discountValue) || 0)) / 100;
        
      const finalTotal = Math.max(0, checkoutOrder.total - discountAmount);

      await fetch(`/api/orders/${checkoutOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "DELIVERED", 
          paymentMethod: closingPaymentMethod,
          total: finalTotal,
          subtotal: checkoutOrder.total,
          discount: discountAmount
        }),
      });
      toast.success("Comanda fechada com sucesso!");
      setCheckoutOrder(null);
      setSelectedOrder(null);
      fetchData();
    } catch (err) {
      toast.error("Erro ao fechar comanda");
    } finally {
      setLoading(false);
    }
  };

  const renderChoicesStr = (choices: any) => {
    if (!choices) return "";
    if (typeof choices === "string") {
      try {
        const parsed = JSON.parse(choices);
        if (Array.isArray(parsed)) {
          return parsed.map((p: any) => p.name).join(", ");
        }
      } catch {
        return choices;
      }
    }
    if (Array.isArray(choices)) {
       return choices.map((c: any) => c.name || c).join(", ");
    }
    return String(choices);
  };

  // ---- CARRINHO INTERNO ----
  const handleProductClick = (product: any) => {
    if (product.optiongroup && product.optiongroup.length > 0) {
      setSelectedProductForOptions(product);
      setProductOptionsSelection({});
    } else {
      addToCart(product);
    }
  };

  const addToCartWithOptions = () => {
    if (!selectedProductForOptions) return;
    const p = selectedProductForOptions;
    
    // Validate required options
    for (const group of p.optiongroup) {
      const selectedCount = Object.values(productOptionsSelection)
        .filter((opt: any) => opt.groupId === group.id).length;
      if (group.isRequired && selectedCount < group.minOptions) {
        return toast.error(`Selecione no mínimo ${group.minOptions} opções para ${group.name}`);
      }
    }

    const selectedKeys = Object.keys(productOptionsSelection);
    const optionsText = selectedKeys.map(k => productOptionsSelection[k].name).join(", ");
    
    // Calculate total extra price based on group priceCalculation
    let extraPrice = 0;
    for (const group of p.optiongroup) {
      const selectedInGroup = selectedKeys
        .filter(k => productOptionsSelection[k].groupId === group.id)
        .map(k => productOptionsSelection[k].price);
      
      if (selectedInGroup.length > 0) {
        if (group.priceCalculation === "SUM") {
          extraPrice += selectedInGroup.reduce((a,b) => a+b, 0);
        } else if (group.priceCalculation === "HIGHEST") {
          extraPrice += Math.max(...selectedInGroup);
        } else if (group.priceCalculation === "AVERAGE") {
          extraPrice += selectedInGroup.reduce((a,b) => a+b, 0) / selectedInGroup.length;
        }
      }
    }

    const uid = `${p.id}-${Date.now()}`;
    setInternalCart(prev => [
      ...prev,
      {
        productId: p.id,
        uid: uid, 
        productName: p.name + (optionsText ? ` (${optionsText})` : ""),
        price: p.price + extraPrice,
        quantity: 1,
        notes: "",
        choices: optionsText
      }
    ]);
    setSelectedProductForOptions(null);
  };

  const addToCart = (product: any) => {
    setInternalCart(prev => {
      const ex = prev.find(i => i.productId === product.id && !i.choices);
      if (ex) return prev.map(i => i.productId === product.id && !i.choices ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, uid: `${product.id}-${Date.now()}`, productName: product.name, price: product.price, quantity: 1, notes: "" }];
    });
  };

  const finalizeInternalOrder = async () => {
    if (!isAddingItems && !internalOrder.tableId) return toast.error("Selecione uma mesa");
    if (internalCart.length === 0) return toast.error("Carrinho vazio");
    setLoading(true);
    try {
      if (isAddingItems) {
        const res = await fetch(`/api/orders/${selectedOrder.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: internalCart }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
        const data = await res.json();
        toast.success("Itens adicionados!");
        setSelectedOrder(data);
      } else {
        const res = await fetch("/api/orders/internal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...internalOrder, items: internalCart }),
        });
        if (!res.ok) throw new Error();
        toast.success("Mesa aberta!");
      }
      setIsCommandModalOpen(false);
      setInternalCart([]);
      setIsCheckoutStep(false);
      setIsAddingItems(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar");
    } finally { setLoading(false); }
  };

  // ---- FILTROS ----
  const filteredOrders = orders.filter(o => {
    const matchesTab = tabFilter === "ALL" || o.orderType === tabFilter;
    const matchesStatus = statusFilter === "ALL" 
      ? true
      : statusFilter === "ACTIVE"
        ? !["DELIVERED", "DONE", "CANCELED"].includes(o.status)
        : ["DELIVERED", "DONE"].includes(o.status);
    const matchesSearch = !searchOrder || 
      o.customerName?.toLowerCase().includes(searchOrder.toLowerCase()) ||
      o.id.includes(searchOrder);
    return matchesTab && matchesStatus && matchesSearch;
  });

  const cartTotal = internalCart.reduce((s, i) => s + i.price * i.quantity, 0);
  const filteredProducts = products.filter(p => p.isActive && p.name.toLowerCase().includes(searchProduct.toLowerCase()));

  // ===== TELA DE LOADING DO CAIXA =====
  if (cashierLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  // ===== TELA DE ABERTURA DE CAIXA =====
  if (!cashier || cashier.status === "CLOSED") {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50 items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-8 text-center border-b border-slate-200">
            <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Banknote size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Ponto de Venda</h2>
            {cashier ? (
              <p className="text-slate-500 text-sm">O caixa de hoje foi fechado. Você pode reabri-lo para continuar.</p>
            ) : (
              <p className="text-slate-500 text-sm">Nenhum caixa aberto. Inicie o dia para operar o PDV.</p>
            )}
          </div>
          <div className="p-8 space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Saldo de Abertura (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={e => setOpeningBalance(e.target.value)}
                placeholder="Ex: 100,00"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
            <button
              onClick={() => manageCashier("OPEN")}
              disabled={cashierLoading}
              className="w-full py-5 bg-orange-500 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {cashier ? "Reabrir Caixa do Dia" : "Abrir Caixa do Dia"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== PDV PRINCIPAL =====
  return (
    <div className={`flex flex-col ${fullscreen ? "h-screen" : "h-screen"} bg-slate-50 overflow-hidden font-sans`}>
      
      {/* HEADER PDV */}
      {!fullscreen && (
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <ShoppingBag size={16} className="text-slate-900" />
            </div>
            <div>
              <span className="text-slate-900 font-black text-sm uppercase tracking-widest">PDV Inteligente</span>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Caixa Aberto • {new Date(cashier.openedAt).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSoundEnabled(v => { saveSettings(!v, autoPrint); return !v; }); }}
              className={`p-2 rounded-lg transition-all border ${soundEnabled ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}
              title={soundEnabled ? "Som ativado" : "Som desativado"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 transition-all"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={() => window.open("/pdv-station", "_blank")}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-100 transition-all"
            >
              <Navigation size={12} /> Tela Cheia
            </button>
            <button
              onClick={() => setShowCloseModal(true)}
              className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-black uppercase hover:bg-red-500/20 transition-all"
            >
              Fechar Caixa
            </button>
          </div>
        </div>
      )}

      {/* CORPO DO PDV */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PAINEL ESQUERDO - LISTA DE PEDIDOS */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
          
          {/* BOTÃO NOVA COMANDA */}
          <div className="p-3 border-b border-slate-200">
            <button
              onClick={() => { 
                if (!hasFeature(storeInfo?.subscription?.plan?.features, 'TABLE_MANAGEMENT')) {
                  toast.error("Gestão de Mesas é um recurso exclusivo de planos superiores.");
                  return;
                }
                setIsAddingItems(false); 
                setIsCommandModalOpen(true); 
                setIsCheckoutStep(false); 
                setInternalCart([]); 
                setInternalOrder({ tableId: "", waiterId: "", customerName: "Consumo Local" }); 
              }}
              className={`w-full bg-blue-600 text-white px-4 py-5 rounded-xl hover:bg-blue-500 flex items-center justify-center gap-3 text-sm font-black uppercase shadow-lg shadow-blue-600/20 active:scale-95 transition-all border border-blue-500 ${!hasFeature(storeInfo?.subscription?.plan?.features, 'TABLE_MANAGEMENT') ? 'opacity-50 grayscale' : ''}`}
            >
              <PlusCircle size={22} /> Abrir Comanda de Mesa
              {!hasFeature(storeInfo?.subscription?.plan?.features, 'TABLE_MANAGEMENT') && <Lock size={14} />}
            </button>
          </div>

          {/* TABS DE FILTRO */}
          <div className="px-3 pt-3 flex gap-1 shrink-0">
            {TAB_FILTERS.map(t => {
              const isTableTab = t.id === "DINING_IN";
              const isLocked = isTableTab && !hasFeature(storeInfo?.subscription?.plan?.features, 'TABLE_MANAGEMENT');
              
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (isLocked) {
                      toast.error("O acesso a pedidos de mesa requer um plano superior.");
                      return;
                    }
                    setTabFilter(t.id);
                  }}
                  className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${tabFilter === t.id ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-slate-50 text-slate-500 hover:text-slate-700"} ${isLocked ? 'opacity-50 grayscale' : ''}`}
                >
                  {t.label}
                  {isLocked && <Lock size={10} />}
                </button>
              );
            })}
          </div>

          {/* FILTRO DE STATUS + BUSCA */}
          <div className="px-3 pt-2 space-y-2 shrink-0">
            <div className="flex gap-1">
              {[["ACTIVE", "Ativos"], ["DONE", "Concluídos"], ["ALL", "Todos"]].map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${statusFilter === val ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-500"}`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input
                type="text"
                placeholder="Buscar pedido..."
                value={searchOrder}
                onChange={e => setSearchOrder(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs pl-9 pr-4 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-orange-500/30 placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* LISTA DE PEDIDOS */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 mt-2">
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="animate-spin text-orange-500 mx-auto" size={20} /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center opacity-30 flex flex-col items-center gap-2">
                <ShoppingBag size={30} className="text-slate-500" />
                <p className="text-[10px] font-black text-slate-500 uppercase">Sem pedidos</p>
              </div>
            ) : filteredOrders.map(order => {
              const isLocal = order.orderType === "DINING_IN";
              const config  = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              const Icon    = config.icon;
              const isSelected = selectedOrder?.id === order.id;
              return (
                <button
                  key={order.id}
                  onClick={() => { setSelectedOrder(order); setDetailOrder(null); }}
                  onDoubleClick={() => setDetailOrder(order)}
                  className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${
                    isSelected
                      ? isLocal ? "bg-blue-600/20 border-blue-500/60 ring-1 ring-blue-500/30" : "bg-orange-500/20 border-orange-500/60 ring-1 ring-orange-500/30"
                      : isLocal ? "bg-blue-900/20 border-blue-800/40 hover:border-blue-600/60 hover:bg-blue-800/20" : "bg-slate-50/60 border-slate-200/50 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {/* Barra lateral colorida */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLocal ? "bg-blue-500" : "bg-orange-500"}`} />

                  <div className="pl-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-black text-xs tracking-tight ${isLocal ? "text-blue-200" : "text-slate-800"}`}>
                            #{order.orderNumber || order.id.slice(-4).toUpperCase()}
                          </span>
                          {isLocal ? (
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              MESA {order.table?.number}
                            </span>
                          ) : (
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              {order.deliveryType}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 mt-0.5 truncate max-w-[150px]">
                          {order.customerName}
                        </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md flex items-center gap-1 ${config.bg} ${config.color} border ${config.border}`}>
                        <Icon size={8} className={order.status === "PREPARING" ? "animate-spin" : ""} />
                        {config.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-600 font-bold flex items-center gap-1">
                        <Clock size={9} /> {formatTime(order.createdAt)}
                      </span>
                      {isLocal && order.waiter?.name && (
                        <span className="text-[8px] bg-slate-50 border border-slate-200 text-blue-400 px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-1">
                          <User size={8} /> {order.waiter.name}
                        </span>
                      )}
                      <span className="text-[9px] font-black text-slate-500">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PAINEL DIREITO - DETALHES */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
          {selectedOrder ? (
            <div className="p-6 max-w-5xl mx-auto w-full space-y-4 pb-20">
              {/* HEADER DO PEDIDO */}
              <div className={`p-4 rounded-xl border flex justify-between items-center ${selectedOrder.orderType === "DINING_IN" ? "bg-blue-900/30 border-blue-700/40" : "bg-slate-50/60 border-slate-200/40"}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-500 lg:hidden">
                    <ChevronLeft size={18} />
                  </button>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                        Pedido #{selectedOrder.orderNumber || selectedOrder.id.slice(-4).toUpperCase()}
                      </h3>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        selectedOrder.orderType === "DINING_IN" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      }`}>
                        {selectedOrder.orderType === "DINING_IN" ? `Mesa ${selectedOrder.table?.number || "?"}` : selectedOrder.deliveryType}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                      {STATUS_CONFIG[selectedOrder.status]?.label} • {formatTime(selectedOrder.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedOrder.status === "PREPARING" && selectedOrder.orderType === "DINING_IN" && (
                    <button
                      onClick={() => { setIsAddingItems(true); setInternalCart([]); setIsCommandModalOpen(true); setIsCheckoutStep(false); }}
                      className="px-3 py-2 bg-blue-600 text-white text-[9px] font-black uppercase rounded-lg flex items-center gap-1 hover:bg-blue-500 transition-all"
                    >
                      <Plus size={12} /> Adicionar Itens
                    </button>
                  )}
                  <button
                    onClick={() => { setDetailOrder(selectedOrder); }}
                    className="px-3 py-2 bg-slate-100 text-slate-700 text-[9px] font-black uppercase rounded-lg flex items-center gap-1 hover:bg-slate-600 transition-all"
                  >
                    <Package size={12} /> Ver Comanda
                  </button>
                  <button
                    onClick={() => autoPrintOrder(selectedOrder)}
                    className="w-9 h-9 bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center justify-center rounded-lg border border-slate-300 transition-all hover:bg-slate-600"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ITENS DA COMANDA */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShoppingBag size={12} /> Prévia de Itens ({selectedOrder.items?.length || 0})
                    </h4>
                    
                    <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                      {selectedOrder.items?.slice(0, 5).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-900 text-[10px] shrink-0 border border-slate-200">
                              {item.quantity}x
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-xs uppercase tracking-tight">{item.productName || item.product?.name}</div>
                              {item.choices && <p className="text-[9px] text-slate-500 mt-0.5">+ {renderChoicesStr(item.choices)}</p>}
                              {item.notes && <p className="text-[10px] text-orange-500 mt-1 font-bold">Obs: {item.notes}</p>}
                            </div>
                          </div>
                          <span className="font-black text-slate-900 text-xs">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {selectedOrder.items?.length > 5 && (
                        <div className="text-center pt-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">E mais {selectedOrder.items.length - 5} itens...</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-center">
                      <button
                        onClick={() => setDetailOrder(selectedOrder)}
                        className="w-full py-3 bg-white border-2 border-orange-500 text-orange-500 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-50 hover:text-orange-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Package size={16} /> Ver detalhes da comanda completos
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 flex justify-between items-center shadow-sm">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-tight">Total do Pedido</span>
                    <span className="text-2xl font-black text-orange-500">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="space-y-4">
                  {/* FLUXO OPERACIONAL */}
                  <div className="bg-slate-50/60 border border-slate-200/40 rounded-xl p-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Ações do Pedido</h4>
                    <div className="space-y-2">
                      {selectedOrder.status === "PENDING" && (
                        <button
                          onClick={() => updateStatus(selectedOrder.id, "PREPARING")}
                          className="w-full p-4 bg-orange-500 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <Clock size={16} /> {selectedOrder.orderType === "DINING_IN" ? "Aceitar Mesa" : "Aceitar Pedido"}
                        </button>
                      )}

                      {selectedOrder.status === "PREPARING" && selectedOrder.orderType === "DINING_IN" && (
                        <div className="space-y-2">
                          <button
                            onClick={() => { setCheckoutOrder(selectedOrder); setDiscountValue("0"); }}
                            className="w-full p-4 bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 size={16} /> Fechar Comanda (Checkout)
                          </button>
                        </div>
                      )}

                      {selectedOrder.status === "PREPARING" && selectedOrder.orderType !== "DINING_IN" && (
                        <div className="space-y-2">
                          {selectedOrder.orderType === "DELIVERY" && (
                            <div className="bg-slate-100/50 p-3 rounded-lg space-y-2">
                              <p className="text-[9px] font-black text-slate-500 uppercase">Atribuir Motoboy</p>
                              {drivers.map(d => (
                                <label key={d.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${selectedDriverId === d.id ? "bg-orange-500/20 border border-orange-500/30" : "hover:bg-slate-600/50"}`}>
                                  <input type="radio" name="driver" checked={selectedDriverId === d.id} onChange={() => setSelectedDriverId(d.id)} className="accent-orange-500" />
                                  <span className="text-[10px] font-black text-slate-700 uppercase">{d.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {selectedOrder.orderType === "DELIVERY" ? (
                            <button onClick={() => updateStatus(selectedOrder.id, "DELIVERING")} className="w-full p-4 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase hover:brightness-110 transition-all flex items-center justify-center gap-2">
                              <Truck size={16} /> Despachar
                            </button>
                          ) : (
                            <button onClick={() => updateStatus(selectedOrder.id, "DELIVERED")} className="w-full p-4 bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase hover:brightness-110 transition-all flex items-center justify-center gap-2">
                              <CheckCircle2 size={16} /> Retirada Confirmada
                            </button>
                          )}
                        </div>
                      )}

                      {selectedOrder.status === "DELIVERING" && (
                        <button onClick={() => updateStatus(selectedOrder.id, "DELIVERED")} className="w-full p-4 bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase hover:brightness-110 transition-all flex items-center justify-center gap-2">
                          <CheckCircle2 size={16} /> Confirmar Entrega
                        </button>
                      )}

                      {!["DELIVERED", "DONE", "CANCELED"].includes(selectedOrder.status) && (
                        <>
                          <div className="h-px bg-slate-100" />
                          <button onClick={() => updateStatus(selectedOrder.id, "CANCELED")} className="w-full py-3 text-red-400 rounded-lg font-black text-[10px] uppercase hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 border border-red-500/20">
                            <XCircle size={14} /> Cancelar Pedido
                          </button>
                        </>
                      )}

                      {["DELIVERED", "DONE"].includes(selectedOrder.status) && (
                        <button onClick={() => updateStatus(selectedOrder.id, "PREPARING")} className="w-full py-3 bg-blue-100 text-blue-600 rounded-lg font-black text-[10px] uppercase hover:bg-blue-200 transition-all flex items-center justify-center gap-2 border border-blue-200">
                          <RotateCcw size={14} /> Reabrir Comanda
                        </button>
                      )}
                    </div>
                  </div>

                  {/* INFO DO CLIENTE */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Informações</h4>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-orange-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-700">{selectedOrder.customerName}</span>
                    </div>
                    {selectedOrder.customerPhone && (
                      <div className="text-[10px] text-slate-500 font-bold ml-6">{selectedOrder.customerPhone}</div>
                    )}
                    {selectedOrder.orderType === "DINING_IN" ? (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-blue-400 shrink-0" />
                          <span className="text-xs font-black text-slate-700">Mesa {selectedOrder.table?.number}</span>
                        </div>
                        {selectedOrder.waiter?.name && (
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-blue-400 shrink-0" />
                            <span className="text-xs text-slate-500 font-bold">{selectedOrder.waiter.name}</span>
                          </div>
                        )}
                      </div>
                    ) : selectedOrder.deliveryType === "DELIVERY" && (
                      <div className="space-y-1 pt-2 border-t border-slate-200">
                        <p className="text-[10px] font-black text-slate-700">{selectedOrder.street}, {selectedOrder.number}</p>
                        <p className="text-[9px] text-slate-500">{selectedOrder.neighborhood}</p>
                        {selectedOrder.reference && (
                          <p className="text-[9px] text-orange-400 italic">{selectedOrder.reference}</p>
                        )}
                        <button className="w-full py-2.5 mt-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 hover:bg-orange-500/20 transition-all">
                          <MapPin size={11} /> Abrir GPS
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 gap-4 opacity-30">
              <AlertCircle className="w-12 h-12 text-slate-600" />
              <div className="text-center">
                <h3 className="text-slate-500 font-black uppercase tracking-widest text-xs">PDV Ativo</h3>
                <p className="text-slate-600 text-xs mt-1">Selecione um pedido para gerenciar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL: DETALHES DA COMANDA (ESTILO RECIBO MODERNO) ===== */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-300 relative border-8 border-white">
            
            {/* Botão Fechar - Estilo Moderno */}
            <button 
              onClick={() => setDetailOrder(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-slate-100/80 hover:bg-white text-slate-400 hover:text-slate-900 rounded-xl transition-all border border-slate-200/50"
            >
              <X size={18} />
            </button>

            {/* Cabeçalho do Recibo */}
            <div className="bg-slate-50 p-8 text-center space-y-4 border-b border-dashed border-slate-200 relative">
              <div className="absolute -bottom-3 left-0 right-0 flex justify-around px-2 overflow-hidden opacity-20 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-slate-400 rounded-full shrink-0" />
                ))}
              </div>

              {storeInfo?.logo ? (
                <img src={storeInfo.logo} alt="Logo" className="w-16 h-16 mx-auto rounded-2xl shadow-sm border border-white" />
              ) : (
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-white">
                  <Receipt size={32} />
                </div>
              )}

              <div>
                <h3 className="font-black text-slate-900 uppercase text-lg leading-tight">
                  {storeInfo?.name || "Recibo de Venda"}
                </h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {storeInfo?.address || "Atendimento Local"}
                </p>
                {storeInfo?.whatsapp && (
                  <p className="text-[9px] text-slate-500 font-bold tracking-widest">{storeInfo.whatsapp}</p>
                )}
              </div>

              <div className="pt-2 flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                   <Barcode size={14} className="text-slate-400" />
                   <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">
                     #{detailOrder.orderNumber || detailOrder.id.slice(-4).toUpperCase()}
                   </span>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase">
                  {new Date(detailOrder.createdAt).toLocaleDateString("pt-BR")} às {formatTime(detailOrder.createdAt)}
                </p>
              </div>
            </div>

            {/* Conteúdo do Rol de itens */}
            <div className="p-8 space-y-6 overflow-y-auto bg-white flex-1">
              {/* Info Mesa/Garçom */}
              {detailOrder.orderType === "DINING_IN" && (
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-900 uppercase">Mesa {detailOrder.table?.number}</span>
                  </div>
                  {detailOrder.waiter?.name && (
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{detailOrder.waiter.name}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Itens Solicitados</h4>
                <div className="space-y-4">
                  {detailOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="group relative">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3 min-w-0">
                          <span className="text-xs font-black text-slate-300 group-hover:text-orange-500 transition-colors">{item.quantity}x</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 uppercase truncate leading-none mb-1">
                              {item.productName || item.product?.name}
                            </p>
                            {item.choices && (
                              <p className="text-[9px] text-slate-500 leading-tight">
                                + {renderChoicesStr(item.choices)}
                              </p>
                            )}
                            {item.notes && (
                              <div className="mt-1 flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 rounded text-[9px] text-orange-600 font-bold w-fit">
                                <ScrollText size={8} /> {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-900 shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="pt-6 mt-6 border-t-2 border-slate-100 border-dashed space-y-2">
                {(() => {
                  const subtotal = detailOrder.subtotal || detailOrder.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
                  const discount = detailOrder.discount || 0;
                  const total = detailOrder.total;
                  const hasDiscount = discount > 0 || (subtotal > total && (subtotal - total) > 0.01);
                  
                  return (
                    <>
                      <div className="flex justify-between items-center text-slate-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Subtotal</span>
                        <span className="text-xs font-black">{formatCurrency(subtotal)}</span>
                      </div>
                      
                      {hasDiscount && (
                        <div className="flex justify-between items-center text-red-500">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Desconto Aplicado</span>
                          <span className="text-xs font-black">- {formatCurrency(discount || (subtotal - total))}</span>
                        </div>
                      )}

                      <div className="pt-4 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase block leading-none mb-1">Total Final</span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Pagamento: {detailOrder.paymentMethod}</span>
                        </div>
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* QR Code Placeholder / Assinatura */}
              <div className="text-center pt-8 space-y-4">
                <div className="inline-block p-2 border-2 border-slate-100 rounded-2xl opacity-40">
                   <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Barcode size={32} className="text-slate-300" />
                   </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8 leading-relaxed">
                   Volte sempre! <br/> Sua presença é muito importante.
                </p>
              </div>
            </div>

            {/* Ações Inferiores Móvel */}
            <div className="p-4 bg-slate-50 border-t flex gap-2">
              <button 
                onClick={() => autoPrintOrder(detailOrder)}
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Printer size={16} /> Imprimir Conta
              </button>
              <button 
                onClick={() => setDetailOrder(null)}
                className="px-6 bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-300 transition-all lg:hidden"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: NOVA COMANDA DE MESA ===== */}
      {isCommandModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`bg-white border border-slate-200 w-full rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all ${isCheckoutStep ? "max-w-sm" : "max-w-5xl h-[85vh]"}`}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg"><ShoppingBag size={16} className="text-slate-900" /></div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">
                  {isAddingItems ? "Adicionar Itens" : isCheckoutStep ? "Confirmar Mesa" : "Nova Comanda"}
                </h3>
              </div>
              <button onClick={() => setIsCommandModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all">
                <X size={18} />
              </button>
            </div>

            {!isCheckoutStep ? (
              <div className="flex-1 flex overflow-hidden">
                {/* CATÁLOGO */}
                <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-50/20">
                  <div className="p-4 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        placeholder="Buscar produto..."
                        value={searchProduct}
                        onChange={e => setSearchProduct(e.target.value)}
                        className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-1 focus:ring-blue-500/30 placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleProductClick(p)}
                        className="group bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-blue-500/60 hover:shadow-md transition-all shadow-sm"
                      >
                        <div className="font-black text-slate-700 text-xs uppercase tracking-tight mb-1 group-hover:text-blue-600 transition-colors">{p.name}</div>
                        {(p.optiongroup && p.optiongroup.length > 0) && (
                          <div className="text-[9px] text-orange-500 font-bold uppercase mb-2">Com opcionais</div>
                        )}
                        <div className="mt-3 flex justify-between items-center">
                          <span className="font-black text-blue-600 text-sm">{formatCurrency(p.price)}</span>
                          <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-blue-600 group-hover:text-slate-900 transition-all">
                            <Plus size={12} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CARRINHO */}
                <div className="w-80 flex flex-col bg-white shrink-0">
                  <div className="p-4 border-b border-slate-200 shrink-0">
                    <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Carrinho ({internalCart.length})</h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {internalCart.length === 0 ? (
                      <div className="h-full flex items-center justify-center opacity-20">
                        <div className="text-center">
                          <ShoppingBag size={32} className="mx-auto mb-2 text-slate-500" />
                          <p className="text-[9px] font-black text-slate-500 uppercase">Carrinho vazio</p>
                        </div>
                      </div>
                    ) : internalCart.map(item => (
                      <div key={item.productId} className="flex items-center gap-3 p-3 bg-slate-50/60 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-slate-700 uppercase truncate">{item.productName}</p>
                          <p className="text-[9px] text-slate-500 font-bold">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setInternalCart(prev => prev.map(i => i.productId === item.productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} className="w-6 h-6 bg-slate-100 text-slate-500 rounded flex items-center justify-center hover:bg-slate-600 text-xs font-black">-</button>
                          <span className="w-6 text-center text-[10px] font-black text-slate-700">{item.quantity}</span>
                          <button onClick={() => setInternalCart(prev => prev.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i))} className="w-6 h-6 bg-slate-100 text-slate-500 rounded flex items-center justify-center hover:bg-slate-600 text-xs font-black">+</button>
                          <button onClick={() => setInternalCart(prev => prev.filter(i => i.productId !== item.productId))} className="w-6 h-6 bg-red-500/10 text-red-400 rounded flex items-center justify-center hover:bg-red-500/20 ml-1"><Trash2 size={10} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-slate-200 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-black text-slate-500 uppercase">Subtotal</span>
                      <span className="text-lg font-black text-slate-900">{formatCurrency(cartTotal)}</span>
                    </div>
                    <button
                      disabled={internalCart.length === 0}
                      onClick={() => isAddingItems ? finalizeInternalOrder() : setIsCheckoutStep(true)}
                      className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isAddingItems ? "Confirmar" : "Próxima Etapa"} <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* CHECKOUT: SELECIONAR MESA E GARÇOM */
              <div className="p-6 space-y-5 overflow-y-auto">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Selecionar Mesa</label>
                  <div className="grid grid-cols-4 gap-2">
                    {tables.filter(t => t.isActive).map(t => (
                      <button
                        key={t.id}
                        onClick={() => setInternalOrder(p => ({ ...p, tableId: t.id }))}
                        className={`p-4 rounded-xl border-2 font-black text-sm transition-all ${internalOrder.tableId === t.id ? "bg-blue-600 text-white border-blue-500 shadow-lg" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-500"}`}
                      >
                        {t.number}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Garçom Responsável</label>
                  <div className="space-y-2">
                    {waiters.filter(w => w.isActive).map(w => (
                      <button
                        key={w.id}
                        onClick={() => setInternalOrder(p => ({ ...p, waiterId: w.id }))}
                        className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${internalOrder.waiterId === w.id ? "bg-blue-600/20 border-blue-500/50 ring-1 ring-blue-500/30" : "bg-slate-50/60 border-slate-200/50 hover:border-slate-300"}`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${internalOrder.waiterId === w.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                          <User size={18} />
                        </div>
                        <span className={`text-xs font-black uppercase ${internalOrder.waiterId === w.id ? "text-blue-400" : "text-slate-500"}`}>{w.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsCheckoutStep(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-xl font-black text-xs uppercase hover:bg-slate-100 transition-all">
                    Voltar
                  </button>
                  <button onClick={finalizeInternalOrder} className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg">
                    Abrir Mesa <CheckCircle2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL: CONFIGURAÇÕES PDV ===== */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Settings size={18} className="text-orange-500" />
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Configurações PDV</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 text-slate-500 hover:text-slate-900 transition-all"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50/60 rounded-xl border border-slate-200/50">
                <div>
                  <p className="text-xs font-black text-slate-700 uppercase">Som de Notificação</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Toca ao chegar novo pedido</p>
                </div>
                <button
                  onClick={() => { const v = !soundEnabled; setSoundEnabled(v); saveSettings(v, autoPrint); }}
                  className={`w-12 h-6 rounded-full transition-all relative ${soundEnabled ? "bg-green-500" : "bg-slate-600"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${soundEnabled ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50/60 rounded-xl border border-slate-200/50">
                <div>
                  <p className="text-xs font-black text-slate-700 uppercase">Impressão Automática</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Imprime ao chegar novo pedido</p>
                </div>
                <button
                  onClick={() => { const v = !autoPrint; setAutoPrint(v); saveSettings(soundEnabled, v); }}
                  className={`w-12 h-6 rounded-full transition-all relative ${autoPrint ? "bg-green-500" : "bg-slate-600"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${autoPrint ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: FECHAR CAIXA ===== */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Fechar Caixa</h3>
              <p className="text-slate-500 text-sm mt-1">Tem certeza? O caixa poderá ser reaberto amanhã.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCloseModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-700 rounded-xl font-black text-xs uppercase hover:bg-slate-100 transition-all">Cancelar</button>
              <button onClick={() => manageCashier("CLOSE")} className="flex-1 py-4 bg-red-600 text-white rounded-xl font-black text-xs uppercase hover:brightness-110 transition-all">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: OPCIONAIS DE PRODUTOS ===== */}
      {selectedProductForOptions && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">{selectedProductForOptions.name}</h3>
              <button onClick={() => setSelectedProductForOptions(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-all">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
              {selectedProductForOptions.optiongroup.map((group: any) => {
                const selectedInGroup = Object.values(productOptionsSelection)
                  .filter((opt: any) => opt.groupId === group.id).length;
                
                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border">
                      <div>
                        <h4 className="font-black text-xs text-slate-800 uppercase tracking-tight">{group.name}</h4>
                        <p className="text-[10px] font-bold text-slate-500">
                          {group.minOptions > 0 ? `Mín: ${group.minOptions}` : "Opcional"} • Máx: {group.maxOptions}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded ${selectedInGroup >= group.minOptions && selectedInGroup <= group.maxOptions ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {selectedInGroup}/{group.maxOptions}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.option.map((opt: any) => {
                        const isSelected = !!productOptionsSelection[opt.id];
                        return (
                          <label key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? "border-blue-500 bg-blue-50" : "border-slate-100 bg-white hover:border-slate-200"}`}>
                            <div className="flex items-center gap-3">
                              <input 
                                type={group.maxOptions === 1 ? "radio" : "checkbox"} 
                                name={`group-${group.id}`}
                                checked={isSelected}
                                onChange={(e) => {
                                  setProductOptionsSelection((prev: any) => {
                                    const next = { ...prev };
                                    if (e.target.checked) {
                                      if (group.maxOptions === 1) {
                                        // Remove o id antigo do mesmo grupo
                                        Object.keys(next).forEach(k => { if(next[k].groupId===group.id) delete next[k]; });
                                      } else if (selectedInGroup >= group.maxOptions) {
                                        toast.error(`Máximo de ${group.maxOptions} opções permitidas`);
                                        return prev;
                                      }
                                      next[opt.id] = { ...opt, groupId: group.id };
                                    } else {
                                      delete next[opt.id];
                                    }
                                    return next;
                                  });
                                }}
                                className="accent-blue-600 w-4 h-4"
                              />
                              <span className="font-bold text-xs text-slate-700">{opt.name}</span>
                            </div>
                            <span className="font-black text-xs text-slate-500">
                              {opt.price > 0 ? `+ ${formatCurrency(opt.price)}` : ""}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t bg-slate-50 shrink-0">
              <button onClick={addToCartWithOptions} className="w-full py-4 bg-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg">
                <Plus size={16} /> Adicionar no Carrinho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: CHECKOUT DE MESA ===== */}
      {checkoutOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white border w-full max-w-lg rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900"><Banknote size={20} /></div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Revisão de Fechamento</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                    MESA {checkoutOrder.table?.number} • {checkoutOrder.waiter?.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setCheckoutOrder(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-all"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Resumo de itens (compacto) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Resumo dos Itens</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {checkoutOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]">{item.quantity}x {item.productName || item.product?.name}</span>
                      <span className="text-[10px] font-black text-slate-800">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Informar Desconto */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Desconto</label>
                <div className="flex gap-2">
                  <select 
                    value={discountType} 
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="p-3 bg-white border rounded-xl text-xs font-black text-slate-700 outline-none"
                  >
                    <option value="FIXED">Valor (R$)</option>
                    <option value="PERCENT">Porcento (%)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    className="flex-1 p-3 bg-white border rounded-xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Forma de Pagamento</p>
                <div className="grid grid-cols-3 gap-2">
                  {[["DINHEIRO", Banknote], ["CARTÃO", CreditCard], ["PIX", Smartphone]].map(([m, Icon]: any) => (
                    <button
                      key={m}
                      onClick={() => setClosingPaymentMethod(m)}
                      className={`p-3 rounded-xl font-black text-[10px] uppercase transition-all flex flex-col items-center gap-1.5 border-2 ${closingPaymentMethod === m ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"}`}
                    >
                      <Icon size={16} /> {m}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Total e Confirmação */}
            <div className="p-6 bg-slate-50 border-t shrink-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-500">Subtotal</span>
                <span className="text-sm font-black text-slate-700">{formatCurrency(checkoutOrder.total)}</span>
              </div>
              
              {(parseFloat(discountValue) > 0) && (
                <div className="flex justify-between items-center mb-1 text-red-500">
                  <span className="text-xs font-bold">Desconto Aplicado</span>
                  <span className="text-sm font-black">
                    - {formatCurrency(discountType === "FIXED" ? (parseFloat(discountValue) || 0) : (checkoutOrder.total * (parseFloat(discountValue) || 0)) / 100)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-5 pt-3 border-t">
                <span className="text-base font-black text-slate-800 uppercase">Total Final</span>
                <span className="text-3xl font-black text-emerald-600">
                  {formatCurrency(Math.max(0, checkoutOrder.total - (discountType === "FIXED" ? (parseFloat(discountValue)||0) : (checkoutOrder.total * (parseFloat(discountValue)||0)) / 100)))}
                </span>
              </div>

              <button
                onClick={finalizeCheckout}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />} Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

