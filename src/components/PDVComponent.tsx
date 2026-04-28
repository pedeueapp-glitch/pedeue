"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingBag, Clock, CheckCircle2, Truck, XCircle, Printer, Search,
  ChevronLeft, X, CreditCard, Banknote, Smartphone, Trash2, Plus,
  PlusCircle, Hash, User, MapPin, Loader2, AlertCircle, Bike,
  Volume2, VolumeX, Navigation, Bell, Settings, Package, ChevronRight, Layers, RotateCcw,
  Receipt, Barcode, ScrollText, Monitor
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { PlanGate } from "@/components/PlanGate";
import { hasFeature } from "@/lib/permissions";
import { Lock, Menu } from "lucide-react";

const STATUS_CONFIG: any = {
  PENDING: { label: "Pendente", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: Clock, next: "PREPARING", prev: null },
  PREPARING: { label: "Em Preparo", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Loader2, next: "DELIVERING", prev: "PENDING" },
  DELIVERING: { label: "Em Rota", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: Truck, next: "DELIVERED", prev: "PREPARING" },
  DELIVERED: { label: "Entregue", color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: CheckCircle2, next: null, prev: "DELIVERING" },
  DONE: { label: "Concluído", color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: CheckCircle2, next: null, prev: null },
  CANCELED: { label: "Cancelado", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: XCircle, next: null, prev: null },
};

const TYPE_LABELS: any = {
  DELIVERY: "Delivery",
  PICKUP: "Retirada",
  DINING_IN: "Mesa",
  TAKEAWAY: "Para Levar",
  RETAIL: "Venda Direta"
};

const getTabFilters = (storeType: string) => {
  const tabs = [
    { id: "ALL", label: "Todos" },
  ];

  if (storeType === "SHOWCASE") {
    tabs.push({ id: "RETAIL", label: "Venda Direta" });
  } else if (storeType === "SERVICE") {
    tabs.push({ id: "SERVICE", label: "Serviços" });
  } else {
    tabs.push({ id: "DINING_IN", label: "Mesas" });
  }

  tabs.push({ id: "DELIVERY", label: "Delivery" });
  return tabs;
};

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
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [waiters, setWaiters] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Caixa
  const [cashier, setCashier] = useState<any>(null);
  const [cashierLoading, setCashierLoading] = useState(true);
  const [isToday, setIsToday] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("0");
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closeReport, setCloseReport] = useState<any>(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);

  // PDV
  const [tabFilter, setTabFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE"); // ACTIVE | DONE | ALL
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [closingPaymentMethod, setClosingPaymentMethod] = useState("DINHEIRO");
  const [searchOrder, setSearchOrder] = useState("");

  // Modal: detalhes do pedido (somente leitura)
  const [detailOrder, setDetailOrder] = useState<any>(null);

  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const { toggle } = useSidebar();
  const [internalCart, setInternalCart] = useState<any[]>([]);
  const [internalOrder, setInternalOrder] = useState({ tableId: "", waiterId: "", customerName: "Consumo Local", observations: "" });
  const [searchProduct, setSearchProduct] = useState("");
  const [isInternalCartOpen, setIsInternalCartOpen] = useState(false);

  // Checkout (Fechamento)
  const [checkoutOrder, setCheckoutOrder] = useState<any>(null);
  const [discountValue, setDiscountValue] = useState("0");
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [closingChangeValue, setClosingChangeValue] = useState("0");

  // Opcionais de Produtos
  const [selectedProductForOptions, setSelectedProductForOptions] = useState<any>(null);
  const [productOptionsSelection, setProductOptionsSelection] = useState<any>({});

  // Configurações PDV
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationSound, setNotificationSound] = useState("notification.mp3");
  const [autoPrint, setAutoPrint] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [autoStart, setAutoStart] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const prevOrdersRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ---- FETCH ----
  // Aceita cashierOpenedAt como parâmetro para evitar race condition:
  // a data do caixa é passada diretamente, sem depender do estado async.
  const fetchData = useCallback(async (cashierOpenedAt?: string | null) => {
    try {
      // 1. Busca informações da loja apenas se ainda não tivermos
      if (!storeInfo) {
        const resStore = await fetch("/api/store");
        if (resStore.ok) {
          const data = await resStore.json();
          setStoreInfo(data);
        }
      }

      // 2. Filtrar pedidos pela data de abertura do caixa.
      // Prioridade: parâmetro recebido > estado cashier (para polling após init)
      const openedAt = cashierOpenedAt !== undefined ? cashierOpenedAt : cashier?.openedAt;
      const cashierQuery = openedAt
        ? `?cashierFrom=${encodeURIComponent(openedAt)}`
        : "";

      const [resOrders, resDrivers, resTables, resWaiters, resProducts] = await Promise.all([
        fetch(`/api/orders${cashierQuery}`),
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
        const added = newIds.filter(id => !prevOrdersRef.current.includes(id));

        if (added.length > 0 && prevOrdersRef.current.length > 0) {
          playNotification();
          if (autoPrint) {
            added.forEach(id => {
              const order = ordData.find((o: any) => o.id === id);
              if (order && (order.orderType === "DELIVERY" || order.orderType === "PICKUP")) {
                autoPrintOrder(order, storeInfo);
              }
            });
          }
        }
        prevOrdersRef.current = newIds;

        setOrders(prev => {
          if (selectedOrder) {
            const updated = ordData.find((o: any) => o.id === selectedOrder.id);
            if (updated && JSON.stringify(updated) !== JSON.stringify(selectedOrder)) {
              setSelectedOrder(updated);
            }
          }
          if (detailOrder) {
            const updated = ordData.find((o: any) => o.id === detailOrder.id);
            if (updated && JSON.stringify(updated) !== JSON.stringify(detailOrder)) {
              setDetailOrder(updated);
            }
          }
          return Array.isArray(ordData) ? ordData : [];
        });
      }
      setDrivers(Array.isArray(drData) ? drData : []);
      setTables(Array.isArray(tbData) ? tbData : (tbData?.tables || []));
      setWaiters(Array.isArray(waData) ? waData : []);
      setProducts(Array.isArray(prData) ? prData : []);
    } catch (e) {
      console.error("Erro ao carregar PDV:", e);
    } finally {
      setLoading(false);
    }
  }, [autoPrint]); // Removido storeInfo para evitar loop

  // Retorna o cashier carregado para uso imediato sem depender do estado
  const fetchCashier = useCallback(async () => {
    try {
      const res = await fetch("/api/pdv/cashier");
      const data = await res.json();
      setCashier(data.cashier);
      setIsToday(data.isToday ?? false);
      if (data.cashier?.withdrawals) {
        try { setWithdrawals(JSON.parse(data.cashier.withdrawals)); } catch { setWithdrawals([]); }
      }
      return data.cashier; // Retorna para uso imediato na inicialização
    } catch (e) { console.error(e); return null; }
    finally { setCashierLoading(false); }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/pdv/settings");
      const data = await res.json();
      setSoundEnabled(data.soundEnabled ?? true);
      setNotificationSound(data.notificationSound ?? "notification.mp3");
      setAutoPrint(data.autoPrint ?? false);
    } catch (e) { /* usa defaults */ }
  }, []);

  const saveSettings = async (sound: boolean, print: boolean, soundFile?: string) => {
    try {
      await fetch("/api/pdv/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soundEnabled: sound,
          autoPrint: print,
          notificationSound: soundFile || notificationSound
        })
      });
      toast.success("Configurações salvas!");
    } catch (e) { toast.error("Erro ao salvar"); }
  };

  useEffect(() => {
    // Carrega impressora salva localmente no navegador/electron
    if (typeof window !== 'undefined') {
      const savedPrinter = localStorage.getItem('thermal_printer_name') || "";
      setSelectedPrinter(savedPrinter);
    }
  }, []);

  // Busca impressoras do Electron quando o modal abrir
  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
    if (showSettings && isElectron && typeof (window as any).require === 'function') {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.invoke('get-printers').then((printers: any[]) => {
          setAvailablePrinters(printers);
        });
        ipcRenderer.invoke('get-autostart').then((enabled: boolean) => {
          setAutoStart(enabled);
        });
      } catch (e) {
        console.error("Erro ao listar impressoras:", e);
      }
    }
  }, [showSettings]);

  useEffect(() => {
    // CORREÇÃO: Inicializa em sequência para garantir que fetchData
    // sempre receba a data correta do caixa (evita race condition).
    async function init() {
      const loadedCashier = await fetchCashier(); // aguarda o caixa
      await fetchSettings();
      await fetchData(loadedCashier?.openedAt ?? null); // passa a data diretamente
    }
    init();

    // Polling de 60s usa o estado `cashier` que já foi populado na init
    const interval = setInterval(() => fetchData(), 60000);
    return () => clearInterval(interval);
  }, [fetchData, fetchCashier, fetchSettings]);

  const cancelItem = async (itemId: string, isCanceled: boolean) => {
    const toastId = toast.loading("Atualizando item...");
    try {
      const res = await fetch(`/api/orders/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCanceled })
      });
      if (!res.ok) throw new Error();
      toast.success(isCanceled ? "Item cancelado" : "Item restaurado", { id: toastId });
      fetchData(); // Recarrega tudo para atualizar totais
    } catch (e) {
      toast.error("Erro ao atualizar item", { id: toastId });
    }
  };

  // WEBSOCKETS REAL-TIME (SOCKET.IO)
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!storeInfo?.id) return;

    // Evita múltiplas conexões em re-renders
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    async function initSocket() {
      try {
        const { io } = await import("socket.io-client");

        // Sempre usa o origin atual: o Nginx faz proxy de /socket.io/ → porta 3020
        const wsUrl = typeof window !== 'undefined' ? window.location.origin : "";

        const socket = io(wsUrl, {
          transports: ["websocket"], // Força WebSocket nativo, evita polling
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
          timeout: 10000,
          path: "/socket.io/",
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join-store", storeInfo.id);
        });

        socket.on("order-received", () => {
          fetchData();
        });

        socket.on("connect_error", (err: any) => {
          console.warn("WebSocket connection error:", err.message);
        });

      } catch (e) {
        console.error("Socket.io error:", e);
      }
    }

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [storeInfo?.id, fetchData]);

  // Atalhos de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsAddingItems(true);
        setInternalCart([]);
        setIsCommandModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandModalOpen(false);
        setIsAddingItems(false);
        setCheckoutOrder(null);
        setShowSettings(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sincroniza Zoom com Electron
  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
    if (isElectron) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.send('set-zoom', zoomLevel);
      } catch (e) { }
    }
  }, [zoomLevel]);

  // ---- NOTIFICAÇÃO ----
  const playNotification = (customSound?: string) => {
    if (!soundEnabled && !customSound) return;
    try {
      const soundToPlay = customSound || notificationSound;
      const audio = new Audio(`/sounds/${soundToPlay}`);
      audio.currentTime = 0;
      audio.play().catch(() => { });
    } catch (e) { }
  };

  const autoPrintOrder = (order: any, store?: any) => {
    const htmlContent = buildReceiptHTML(order, store || storeInfo);

    // Verifica se está rodando dentro do Electron com NodeIntegration ativo
    const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
    const hasRequire = typeof (window as any).require === 'function';

    if (isElectron && hasRequire) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        const printerName = localStorage.getItem('thermal_printer_name') || "";
        ipcRenderer.send('print-silent', { htmlContent, printerName });
        toast.success("Enviado para impressora térmica");
        return;
      } catch (e) {
        console.error("Erro na impressão Electron:", e);
      }
    }

    // Fallback para navegador
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const buildCashierReportHTML = (report: any, store?: any) => {
    const s = store || storeInfo;
    const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
    return `<html><head><title>Relatório de Caixa</title>
    <style>
      body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; padding: 10px; color: #000; }
      .center { text-align: center; } .bold { font-weight: bold; } .large { font-size: 16px; }
      .div { border-top: 1px dashed #000; margin: 8px 0; } table { width: 100%; } td { padding: 2px 0; }
      .total { font-size: 15px; font-weight: bold; }
    </style></head><body>
    <div class="center bold large">${s?.name || "RELATÓRIO"}</div>
    <div class="center" style="font-size:10px">Relatório de Fechamento de Caixa</div>
    <div class="div"></div>
    <div>Abertura: ${new Date(report.openedAt).toLocaleString("pt-BR")}</div>
    <div>Fechamento: ${new Date(report.closedAt).toLocaleString("pt-BR")}</div>
    <div class="div"></div>
    <table>
      <tr><td>Total de Pedidos</td><td align="right" class="bold">${report.totalOrders}</td></tr>
      <tr><td>Cancelamentos</td><td align="right">${report.canceledOrders}</td></tr>
      <tr><td>Delivery</td><td align="right">${report.totalDelivery}</td></tr>
      <tr><td>Comandas (Local)</td><td align="right">${report.totalComandas}</td></tr>
    </table>
    <div class="div"></div>
    <div class="bold">FORMAS DE PAGAMENTO</div>
    <table>
      <tr><td>Dinheiro</td><td align="right">${fmt(report.totalDinheiro)}</td></tr>
      ${report.totalDeliveryFeesDinheiro > 0 ? `<tr style="font-size:10px;color:#555"><td>&nbsp;&nbsp;↳ Somente Taxas Entr.</td><td align="right">${fmt(report.totalDeliveryFeesDinheiro)}</td></tr>` : ""}
      <tr><td>Cartão</td><td align="right">${fmt(report.totalCartao)}</td></tr>
      <tr><td>PIX</td><td align="right">${fmt(report.totalPix)}</td></tr>
    </table>
    ${report.withdrawals?.length > 0 ? `<div class="div"></div><div class="bold">RETIRADAS</div><table>${report.withdrawals.map((w: any) => `<tr><td>${w.reason}</td><td align="right">- ${fmt(w.amount)}</td></tr>`).join("")}</table>` : ""}
    <div class="div"></div>
    <table>
      <tr><td>Total Bruto</td><td align="right">${fmt(report.totalGeral)}</td></tr>
      ${report.totalWithdrawals > 0 ? `<tr><td>(-) Retiradas</td><td align="right">- ${fmt(report.totalWithdrawals)}</td></tr>` : ""}
    </table>
    <div class="div"></div>
    <div class="center total">TOTAL LÍQUIDO: ${fmt(report.totalLiquido)}</div>
    <div class="div"></div>
    <div class="center" style="font-size:10px;margin-top:10px">Sistema PDV PEDEUE.COM</div>
    </body></html>`;
  };

  const buildReceiptHTML = (order: any, store?: any) => {
    const subtotal = order.subtotal || order.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
    const discount = order.discount || 0;
    const total = order.total;
    const s = store || storeInfo;

    return `
      <html><head><title>Comanda #${order.orderNumber || order.id.slice(-4).toUpperCase()}</title>
      <style>
        body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 280px; padding: 10px; color: #000; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 16px; }
        .divisor { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; vertical-align: top; }
        .item-row { font-size: 11px; }
        .choices { font-size: 9px; margin-left: 10px; font-style: italic; }
        .notes { font-size: 9px; margin-left: 10px; font-weight: bold; }
        .total-row { font-size: 14px; font-weight: bold; }
      </style>
      </head><body>
      
      <div class="text-center">
        <div class="bold large">${s?.name || "LOJA"}</div>
        ${s?.address ? `<div style="font-size: 10px;">${s.address}</div>` : ""}
        ${s?.whatsapp ? `<div style="font-size: 10px;">Whats: ${s.whatsapp}</div>` : ""}
      </div>

      <div class="divisor"></div>
      
      <div class="text-center bold">COMANDA #${order.orderNumber || order.id.slice(-4).toUpperCase()}</div>
      <div class="text-center" style="font-size: 10px;">${new Date(order.createdAt).toLocaleString("pt-BR")}</div>
      
      <div class="divisor"></div>
      
      ${order.orderType === "DINING_IN" ? `
        <div>MESA: ${order.table?.number || "?"}</div>
        <div>GARÇOM: ${order.waiter?.name || "?"}</div>
      ` : `
        <div>TIPO: ${TYPE_LABELS[order.deliveryType] || order.deliveryType}</div>
      `}
      
      <div class="divisor"></div>
      
      <div class="bold">CLIENTE: ${order.customerName}</div>
      ${order.customerPhone ? `<div>TEL: ${order.customerPhone}</div>` : ""}
      ${order.orderType === "DELIVERY" ? `
        <div class="bold">ENDEREÇO:</div>
        <div>${order.street}, ${order.number}</div>
        <div>${order.neighborhood}</div>
        ${order.reference ? `<div>REF: ${order.reference}</div>` : ""}
      ` : ""}

      <div class="divisor"></div>

      <table>
        <tr class="bold"><td width="70%">ITEM</td><td align="right">TOTAL</td></tr>
        ${order.items?.map((i: any) => `
          <tr class="item-row">
            <td>${i.quantity}x ${i.productName || i.product?.name}</td>
            <td align="right">${formatCurrency(i.price * i.quantity)}</td>
          </tr>
          ${i.choices ? `<tr><td colspan="2" class="choices">+ ${renderChoicesStr(i.choices)}</td></tr>` : ""}
          ${i.notes ? `<tr><td colspan="2" class="notes">${i.notes}</td></tr>` : ""}
        `).join("") || ""}
      </table>

      <div class="divisor"></div>

      <table>
        <tr><td>SUBTOTAL</td><td align="right">${formatCurrency(subtotal)}</td></tr>
        ${(order.orderType === "DELIVERY" || order.deliveryFee > 0) ? `<tr><td>TAXA DE ENTREGA</td><td align="right">${order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : "GRÁTIS"}</td></tr>` : ""}
        ${discount > 0 ? `<tr><td>DESCONTO</td><td align="right">-${formatCurrency(discount)}</td></tr>` : ""}
        <tr class="total-row"><td>TOTAL</td><td align="right">${formatCurrency(total)}</td></tr>
      </table>

      ${(order.paymentMethod?.toUpperCase() === "DINHEIRO" || order.paymentMethod?.toUpperCase() === "CASH") && order.change > 0 ? `
        <div class="divisor"></div>
        <div class="bold">INFORMAÇÃO DE TROCO:</div>
        <div>Pago com: ${formatCurrency(order.change)}</div>
        <div class="bold">Troco a devolver: ${formatCurrency(Math.max(0, order.change - order.total))}</div>
      ` : ""}

      <div class="divisor"></div>
      
      <div class="bold">FORMA DE PAGAMENTO:</div>
      <div>${order.paymentMethod || "NÃO INFORMADO"}</div>

      ${order.observations ? `
        <div class="divisor"></div>
        <div class="bold">OBSERVAÇÕES:</div>
        <div style="font-style: italic; white-space: pre-wrap;">${order.observations}</div>
      ` : ""}

      <div class="divisor"></div>
      
      <div class="text-center" style="font-size: 10px; margin-top: 10px;">
        OBRIGADO PELA PREFERÊNCIA!<br/>
        SISTEMA PDV PEDEUE.COM
      </div>

      </body></html>
    `;
  };

  // ---- CAIXA ----
  const manageCashier = async (action: "OPEN" | "CLOSE" | "PREVIEW") => {
    setCashierLoading(true);
    try {
      const res = await fetch("/api/pdv/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, openingBalance: parseFloat(openingBalance) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao gerenciar caixa");
        return;
      }

      if (action === "OPEN") {
        setCashier(data.cashier);
        setIsToday(true);
        setWithdrawals([]);
        toast.success("Caixa aberto!");
        setShowOpenModal(false);
      } else if (action === "PREVIEW") {
        setCloseReport(data.report || null);
        setShowCloseModal(true);
      } else {
        setCashier(data.cashier);
        setShowCloseConfirm(false);
        setShowCloseModal(false); // Fecha o modal de relatório após fechar definitivo
        setCloseReport(data.report || null); // Atualiza com o relatório final se necessário
        toast.success("Caixa fechado com sucesso!");
        // Opcionalmente abrir o modal final de novo ou redirecionar
        setShowCloseModal(true); // Abre o modal final de novo com o status fechado
      }
    } catch (error) {
      toast.error("Erro ao gerenciar caixa");
    } finally {
      setCashierLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalReason.trim() || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      toast.error("Informe o motivo e o valor da retirada.");
      return;
    }
    setWithdrawalLoading(true);
    try {
      const res = await fetch("/api/pdv/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "WITHDRAWAL",
          withdrawal: { reason: withdrawalReason, amount: parseFloat(withdrawalAmount) }
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = data.cashier?.withdrawals ? JSON.parse(data.cashier.withdrawals) : [];
      setWithdrawals(updated);
      setCashier(data.cashier);
      setWithdrawalReason("");
      setWithdrawalAmount("");
      setShowWithdrawalModal(false);
      toast.success("Retirada registrada!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao registrar retirada");
    } finally { setWithdrawalLoading(false); }
  };

  const openGPS = (order: any) => {
    if (!order) return;
    let query = "";
    if (order.latitude && order.longitude) {
      query = `${order.latitude},${order.longitude}`;
    } else {
      query = `${order.street}, ${order.number}, ${order.neighborhood}`;
      if (order.city) query += `, ${order.city}`;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

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
          discount: discountAmount,
          change: closingPaymentMethod === "DINHEIRO" ? parseFloat(closingChangeValue) || 0 : null
        }),
      });
      if (closingPaymentMethod === "DINHEIRO") {
        const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
        if (isElectron) {
          try {
            const { ipcRenderer } = (window as any).require('electron');
            const printerName = localStorage.getItem('thermal_printer_name') || "";
            ipcRenderer.send('open-drawer', printerName);
          } catch (e) { }
        }
      }

      toast.success("Comanda finalizada!");
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

    const originalBasePrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
    let currentBasePrice = originalBasePrice;
    let sumOfAdicionais = 0;

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

    const extraPrice = (currentBasePrice - originalBasePrice) + sumOfAdicionais;

    let comboNotes = "";
    if (p.isCombo && p.comboConfig) {
      try {
        const comboItemIds = JSON.parse(p.comboConfig);
        if (Array.isArray(comboItemIds)) {
          const itemsFound = comboItemIds.map(id => {
            const pFound = products.find(prod => prod.id === id);
            return pFound ? pFound.name : null;
          }).filter(Boolean);

          if (itemsFound.length > 0) {
            comboNotes = "Itens: " + itemsFound.join(", ");
          }
        }
      } catch (e) { }
    }


    const uid = `${p.id}-${Date.now()}`;
    setInternalCart(prev => [
      ...prev,
      {
        productId: p.id,
        uid: uid,
        productName: p.name + (optionsText ? ` (${optionsText})` : ""),
        price: (p.salePrice || p.price) + extraPrice,
        quantity: 1,
        notes: comboNotes,
        choices: optionsText
      }
    ]);

    setSelectedProductForOptions(null);
  };

  const addToCart = (product: any) => {
    let comboNotes = "";
    if (product.isCombo && product.comboConfig) {

      try {
        const comboItemIds = JSON.parse(product.comboConfig);
        if (Array.isArray(comboItemIds)) {
          const itemsFound = comboItemIds.map(id => {
            const pFound = products.find(p => p.id === id);
            return pFound ? pFound.name : null;
          }).filter(Boolean);

          if (itemsFound.length > 0) {
            comboNotes = "Itens: " + itemsFound.join(", ");
          }
        }
      } catch (e) { }
    }


    setInternalCart(prev => {
      const ex = prev.find(i => i.productId === product.id && !i.choices && i.notes === comboNotes);
      if (ex) return prev.map(i => i.productId === product.id && !i.choices && i.notes === comboNotes ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        productId: product.id,
        uid: `${product.id}-${Date.now()}`,
        productName: product.name,
        price: product.salePrice || product.price,
        quantity: 1,
        notes: comboNotes
      }];
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
        const storeType = storeInfo?.storeType || "RESTAURANT";
        const finalOrderType = storeType === "SHOWCASE" ? "RETAIL" : storeType === "SERVICE" ? "SERVICE" : "DINING_IN";

        const res = await fetch("/api/orders/internal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...internalOrder,
            orderType: finalOrderType,
            items: internalCart
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erro ao processar");
        }
        toast.success(storeType === "RESTAURANT" ? "Mesa aberta!" : "Venda registrada!");
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
  const filteredProducts = products.filter(p => {
    const storeType = storeInfo?.storeType || "RESTAURANT";
    const matchesType = p.productType === storeType || (!p.productType && storeType === "RESTAURANT");
    const matchesSearch = p.name.toLowerCase().includes(searchProduct.toLowerCase());
    return p.isActive && matchesType && matchesSearch;
  });

  // ===== TELA DE LOADING DO CAIXA =====
  if (cashierLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  // ===== TELA DE ABERTURA DE CAIXA =====
  if (!cashier || cashier.status === "CLOSED") {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50 items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-8 text-center border-b border-slate-200">
            <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
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
              <label className="text-[10px] font-black text-slate-500  tracking-widest block mb-2">Saldo de Abertura (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={e => setOpeningBalance(e.target.value)}
                placeholder="Ex: 100,00"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              />
            </div>
            <button
              onClick={() => manageCashier("OPEN")}
              disabled={cashierLoading}
              className="w-full py-5 bg-purple-500 text-white rounded-xl font-black  tracking-widest text-sm shadow-lg shadow-purple-500/30 hover:bg-purple-600 transition-all active:scale-95 disabled:opacity-50"
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
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2 lg:gap-3">
          <button
            onClick={toggle}
            className="p-2 -ml-2 text-slate-500 hover:text-navy lg:hidden transition-all"
          >
            <Menu size={20} />
          </button>
          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <ShoppingBag size={16} className="text-white" />
          </div>
          <div>
            <span className="text-slate-900 font-black text-sm tracking-widest hidden sm:inline-block">PDV Inteligente</span>
            <span className="text-slate-900 font-black text-sm tracking-widest sm:hidden">PDV</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-slate-500 tracking-widest">Caixa Aberto</span>
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-[10px] font-black  flex items-center gap-2 hover:bg-slate-100 transition-all"
          >
            <Navigation size={12} /> Tela Cheia
          </button>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg text-[10px] font-black flex items-center gap-2 hover:bg-amber-500/20 transition-all"
          >
            <Banknote size={12} /> Retirada
          </button>
          <button
            onClick={() => manageCashier("PREVIEW")}
            className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-black  hover:bg-red-500/20 transition-all"
          >
            Fechar Caixa
          </button>
        </div>
      </div>


      {/* CORPO DO PDV */}
      <div className="flex-1 flex overflow-hidden">

        {/* PAINEL ESQUERDO - LISTA DE PEDIDOS */}
        <div className={`
          ${selectedOrder ? "hidden lg:flex" : "flex"} 
          w-full lg:w-80 bg-white border-r border-slate-200 flex-col shrink-0
        `}>

          {/* BOTÃO NOVA COMANDA */}
          <div className="p-3 border-b border-slate-200">
            <button
              onClick={() => {
                const storeType = storeInfo?.storeType || "RESTAURANT";
                if (storeType === "RESTAURANT" && !hasFeature(storeInfo?.subscription?.plan?.features, 'TABLE_MANAGEMENT')) {
                  toast.error("Gestão de Mesas é um recurso exclusivo de planos superiores.");
                  return;
                }
                setIsAddingItems(false);
                setInternalCart([]);
                setInternalOrder({ tableId: "", waiterId: "", customerName: storeType === "RESTAURANT" ? "Consumo Local" : "Venda Rápida" });

                if (storeType !== "RESTAURANT") {
                  // Venda direta não precisa de mesa/garçom, abre direto os itens
                  setIsCommandModalOpen(true);
                  setIsCheckoutStep(false);
                } else {
                  setIsCommandModalOpen(true);
                  setIsCheckoutStep(false);
                }
              }}
              className={`w-full bg-purple-600 text-white px-4 py-5 rounded-xl hover:bg-purple-500 flex items-center justify-center gap-3 text-sm font-black  shadow-lg shadow-purple-600/20 active:scale-95 transition-all border border-purple-500 ${storeInfo?.storeType === "RESTAURANT" && !hasFeature(storeInfo?.subscription?.plan?.features, 'TABLE_MANAGEMENT') ? 'opacity-50 grayscale' : ''}`}
            >
              <PlusCircle size={22} /> {storeInfo?.storeType === "SHOWCASE" ? "Nova Venda Direta" : storeInfo?.storeType === "SERVICE" ? "Novo Orçamento" : "Abrir Comanda de Mesa"}
              {storeInfo?.storeType === "RESTAURANT" && !hasFeature(storeInfo?.subscription?.plan?.features, 'TABLE_MANAGEMENT') && <Lock size={14} />}
            </button>
          </div>

          {/* TABS DE FILTRO - MOBILE COMPACT */}
          <div className="px-3 pt-3 flex gap-1 overflow-x-auto no-scrollbar shrink-0">
            {getTabFilters(storeInfo?.storeType).map(t => {
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
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black tracking-wider transition-all whitespace-nowrap ${tabFilter === t.id ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "bg-slate-100 text-slate-500 hover:text-slate-700"} ${isLocked ? 'opacity-50 grayscale' : ''}`}
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
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black  transition-all ${statusFilter === val ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-500"}`}
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
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs pl-9 pr-4 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-purple-500/30 placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* LISTA DE PEDIDOS */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 mt-2">
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="animate-spin text-purple-500 mx-auto" size={20} /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center opacity-30 flex flex-col items-center gap-2">
                <ShoppingBag size={30} className="text-slate-500" />
                <p className="text-[10px] font-black text-slate-500 ">Sem pedidos</p>
              </div>
            ) : filteredOrders.map(order => {
              const isLocal = order.orderType === "DINING_IN";
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              const Icon = config.icon;
              const isSelected = selectedOrder?.id === order.id;
              return (
                <button
                  key={order.id}
                  onClick={() => { setSelectedOrder(order); setDetailOrder(null); }}
                  onDoubleClick={() => setDetailOrder(order)}
                  className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${isSelected
                    ? isLocal ? "bg-purple-600/20 border-purple-500/60 ring-1 ring-purple-500/30" : "bg-purple-500/20 border-purple-500/60 ring-1 ring-purple-500/30"
                    : isLocal ? "bg-navy/20 border-navy/40 hover:border-purple-600/60 hover:bg-navy/20" : "bg-slate-50/60 border-slate-200/50 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                >
                  {/* Barra lateral colorida */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLocal ? "bg-purple-500" : "bg-purple-500"}`} />

                  <div className="pl-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-black text-xs tracking-tight ${isLocal ? "text-purple-600" : "text-slate-800"}`}>
                            #{order.orderNumber || order.id.slice(-4).toUpperCase()}
                          </span>
                          {isLocal ? (
                            <span className="text-[8px] font-black  px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 border border-purple-500/30">
                              MESA {order.table?.number}
                            </span>
                          ) : (
                            <span className="text-[8px] font-black  px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 border border-purple-500/30">
                              {TYPE_LABELS[order.deliveryType] || order.deliveryType}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-bold text-slate-700 mt-0.5 truncate max-w-[150px]">
                          {order.customerName}
                        </div>
                      </div>
                      <span className={`text-[8px] font-black  px-1.5 py-0.5 rounded-md flex items-center gap-1 ${config.bg} ${config.color} border ${config.border}`}>
                        <Icon size={8} className={order.status === "PREPARING" ? "animate-spin" : ""} />
                        {config.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-600 font-bold flex items-center gap-1">
                        <Clock size={9} /> {formatTime(order.createdAt)}
                      </span>
                      {isLocal && order.waiter?.name && (
                        <span className="text-[8px] bg-slate-50 border border-slate-200 text-purple-700 px-1.5 py-0.5 rounded font-black  flex items-center gap-1">
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
        <div className={`
          ${selectedOrder ? "flex" : "hidden lg:flex"} 
          fixed lg:relative inset-0 lg:inset-auto z-[110] lg:z-auto
          flex-1 flex-col bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300
        `}>
          {selectedOrder ? (
            <div className="p-6 max-w-5xl mx-auto w-full space-y-4 pb-20">
              {/* HEADER DO PEDIDO */}
              <div className={`p-4 rounded-xl border flex justify-between items-center ${selectedOrder.orderType === "DINING_IN" ? "bg-navy/30 border-navy/40" : "bg-slate-50/60 border-slate-200/40"}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-500 lg:hidden">
                    <ChevronLeft size={18} />
                  </button>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 tracking-tight ">
                        Pedido #{selectedOrder.orderNumber || selectedOrder.id.slice(-4).toUpperCase()}
                      </h3>
                      <span className={`text-[9px] font-black  px-2 py-0.5 rounded-md border ${selectedOrder.orderType === "DINING_IN" ? "bg-purple-500/20 text-purple-700 border-purple-500/30" : "bg-purple-500/20 text-purple-700 border-purple-500/30"
                        }`}>
                        {selectedOrder.orderType === "DINING_IN" ? `Mesa ${selectedOrder.table?.number || "?"}` : (TYPE_LABELS[selectedOrder.deliveryType] || selectedOrder.deliveryType)}
                      </span>
                    </div>
                    <p className="text-slate-800 text-[10px] font-bold  tracking-widest mt-0.5">
                      {STATUS_CONFIG[selectedOrder.status]?.label} • {formatTime(selectedOrder.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedOrder.status === "PREPARING" && selectedOrder.orderType === "DINING_IN" && (
                    <button
                      onClick={() => { setIsAddingItems(true); setInternalCart([]); setIsCommandModalOpen(true); setIsCheckoutStep(false); }}
                      className="px-3 py-2 bg-purple-600 text-white text-[9px] font-black  rounded-lg flex items-center gap-1 hover:bg-purple-500 transition-all"
                    >
                      <Plus size={12} /> Adicionar Itens
                    </button>
                  )}
                  <button
                    onClick={() => { setDetailOrder(selectedOrder); }}
                    className="px-3 py-2 bg-slate-100 text-slate-700 text-[9px] font-black  rounded-lg flex items-center gap-1 hover:bg-slate-600 transition-all"
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
                    <h4 className="text-[10px] font-black text-slate-500  tracking-widest mb-4 flex items-center gap-2">
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
                              <div className={`font-bold text-slate-800 text-xs tracking-tight ${item.isCanceled ? "line-through text-slate-400" : ""}`}>
                                {item.productName || item.product?.name}
                              </div>
                              {item.choices && <p className={`text-[9px] text-slate-500 mt-0.5 ${item.isCanceled ? "line-through opacity-50" : ""}`}>+ {renderChoicesStr(item.choices)}</p>}
                              {item.notes && <p className="text-[10px] text-purple-500 mt-1 font-bold">Obs: {item.notes}</p>}
                            </div>
                          </div>
                          <span className={`font-black text-slate-900 text-xs ${item.isCanceled ? "line-through text-slate-300" : ""}`}>
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                      {selectedOrder.items?.length > 5 && (
                        <div className="text-center pt-2">
                          <p className="text-[10px] font-bold text-slate-400 ">E mais {selectedOrder.items.length - 5} itens...</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-center">
                      <button
                        onClick={() => setDetailOrder(selectedOrder)}
                        className="w-full py-3 bg-white border-2 border-purple-500 text-purple-500 rounded-xl font-black  text-xs tracking-widest hover:bg-purple-50 hover:text-purple-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Package size={16} /> Ver detalhes da comanda completos
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-bold border-b border-slate-50 pb-2">
                       <span>Subtotal</span>
                       <span>{formatCurrency(selectedOrder.subtotal || (selectedOrder.total - (selectedOrder.deliveryFee || 0) + (selectedOrder.discount || 0)))}</span>
                    </div>
                    {selectedOrder.deliveryFee > 0 && (
                      <div className="flex justify-between items-center text-xs text-slate-500 font-bold border-b border-slate-50 pb-2">
                         <span>Taxa de Entrega</span>
                         <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                      </div>
                    )}
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between items-center text-xs text-red-400 font-bold border-b border-slate-50 pb-2">
                         <span>Desconto</span>
                         <span>-{formatCurrency(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black text-slate-500  tracking-tight">Total do Pedido</span>
                       <span className="text-2xl font-black text-purple-500">{formatCurrency(selectedOrder.total)}</span>
                    </div>

                    {(selectedOrder.paymentMethod?.toUpperCase() === "DINHEIRO" || selectedOrder.paymentMethod?.toUpperCase() === "CASH") && selectedOrder.change > 0 && (
                      <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-100 bg-slate-50/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                           <span>Pagamento em Dinheiro</span>
                           <Banknote size={12} />
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                           <span>Pago com</span>
                           <span>{formatCurrency(selectedOrder.change)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-black text-purple-600 mt-1">
                           <span>Troco a devolver</span>
                           <span>{formatCurrency(Math.max(0, selectedOrder.change - selectedOrder.total))}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="space-y-4">
                  {/* FLUXO OPERACIONAL */}
                  <div className="bg-slate-50/60 border border-slate-200/40 rounded-xl p-4">
                    <h4 className="text-[10px] font-black text-slate-500  tracking-widest mb-3">Ações do Pedido</h4>
                    <div className="space-y-2">
                      {selectedOrder.status === "PENDING" && (
                        <button
                          onClick={() => updateStatus(selectedOrder.id, "PREPARING")}
                          className="w-full p-4 bg-purple-500 text-white rounded-lg font-black text-[10px]  shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <Clock size={16} /> {selectedOrder.orderType === "DINING_IN" ? "Aceitar Mesa" : "Aceitar Pedido"}
                        </button>
                      )}

                      {selectedOrder.status === "PREPARING" && selectedOrder.orderType === "DINING_IN" && (
                        <div className="space-y-2">
                          <button
                            onClick={() => { setCheckoutOrder(selectedOrder); setDiscountValue("0"); setClosingChangeValue("0"); }}
                            className="w-full p-4 bg-emerald-600 text-white rounded-lg font-black text-[10px]  shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 size={16} /> Finalizar e Fechar Comanda
                          </button>
                        </div>
                      )}

                      {selectedOrder.status === "PREPARING" && selectedOrder.orderType !== "DINING_IN" && (
                        <div className="space-y-2">
                          {selectedOrder.orderType === "DELIVERY" && (
                            <div className="bg-slate-100/50 p-3 rounded-lg space-y-2">
                              <p className="text-[9px] font-black text-slate-500 ">Atribuir Motoboy</p>
                              {drivers.map(d => (
                                <label key={d.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${selectedDriverId === d.id ? "bg-purple-500/20 border border-purple-500/30" : "hover:bg-slate-600/50"}`}>
                                  <input type="radio" name="driver" checked={selectedDriverId === d.id} onChange={() => setSelectedDriverId(d.id)} className="accent-purple-500" />
                                  <span className="text-[10px] font-black text-slate-700 ">{d.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {selectedOrder.orderType === "DELIVERY" ? (
                            <button onClick={() => updateStatus(selectedOrder.id, "DELIVERING")} className="w-full p-4 bg-purple-600 text-white rounded-lg font-black text-[10px]  hover:brightness-110 transition-all flex items-center justify-center gap-2">
                              <Truck size={16} /> Despachar
                            </button>
                          ) : (
                            <button onClick={() => updateStatus(selectedOrder.id, "DELIVERED")} className="w-full p-4 bg-emerald-600 text-white rounded-lg font-black text-[10px]  hover:brightness-110 transition-all flex items-center justify-center gap-2">
                              <CheckCircle2 size={16} /> Retirada Confirmada
                            </button>
                          )}
                        </div>
                      )}

                      {selectedOrder.status === "DELIVERING" && (
                        <button onClick={() => updateStatus(selectedOrder.id, "DELIVERED")} className="w-full p-4 bg-emerald-600 text-white rounded-lg font-black text-[10px]  hover:brightness-110 transition-all flex items-center justify-center gap-2">
                          <CheckCircle2 size={16} /> Confirmar Entrega
                        </button>
                      )}

                      {!["DELIVERED", "DONE", "CANCELED"].includes(selectedOrder.status) && (
                        <>
                          <div className="h-px bg-slate-100" />
                          <button onClick={() => updateStatus(selectedOrder.id, "CANCELED")} className="w-full py-3 text-red-400 rounded-lg font-black text-[10px]  hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 border border-red-500/20">
                            <XCircle size={14} /> Cancelar Pedido
                          </button>
                        </>
                      )}

                      {["DELIVERED", "DONE", "CANCELED"].includes(selectedOrder.status) && (
                        <button onClick={() => updateStatus(selectedOrder.id, "PREPARING")} className="w-full py-3 bg-purple-100 text-purple-600 rounded-lg font-black text-[10px]  hover:bg-purple-200 transition-all flex items-center justify-center gap-2 border border-purple-200">
                          <RotateCcw size={14} /> Reabrir Comanda
                        </button>
                      )}
                    </div>
                  </div>

                  {/* INFO DO CLIENTE */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="text-[9px] font-black text-slate-600  tracking-widest">Informações</h4>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-purple-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-700">{selectedOrder.customerName}</span>
                    </div>
                    {selectedOrder.customerPhone && (
                      <div className="text-[10px] text-slate-500 font-bold ml-6">{selectedOrder.customerPhone}</div>
                    )}
                    {selectedOrder.orderType === "DINING_IN" ? (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-purple-600 shrink-0" />
                          <span className="text-xs font-black text-slate-900">Mesa {selectedOrder.table?.number}</span>
                        </div>
                        {selectedOrder.waiter?.name && (
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-purple-400 shrink-0" />
                            <span className="text-xs text-slate-500 font-bold">{selectedOrder.waiter.name}</span>
                          </div>
                        )}
                      </div>
                    ) : selectedOrder.deliveryType === "DELIVERY" && (
                      <div className="space-y-1 pt-2 border-t border-slate-200">
                        <p className="text-[10px] font-black text-slate-700">{selectedOrder.street}, {selectedOrder.number}</p>
                        <p className="text-[9px] text-slate-500">{selectedOrder.neighborhood}</p>
                        {selectedOrder.reference && (
                          <p className="text-[9px] text-purple-400 italic">{selectedOrder.reference}</p>
                        )}
                        <button
                          onClick={() => openGPS(selectedOrder)}
                          className="w-full py-2.5 mt-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-[9px] font-black  flex items-center justify-center gap-1 hover:bg-purple-500/20 transition-all"
                        >
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
                <h3 className="text-slate-500 font-black  tracking-widest text-xs">PDV Ativo</h3>
                <p className="text-slate-600 text-xs mt-1">Selecione um pedido para gerenciar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL: DETALHES DA COMANDA (ESTILO RECIBO MODERNO) ===== */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col lg:flex-row max-h-[92vh] animate-in fade-in zoom-in duration-300 relative border-4 lg:border-8 border-white">

            {/* Botão Fechar - Estilo Moderno */}
            <button
              onClick={() => setDetailOrder(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-slate-100/80 hover:bg-white text-slate-400 hover:text-slate-900 rounded-xl transition-all border border-slate-200/50"
            >
              <X size={18} />
            </button>

            {/* LADO ESQUERDO: ESTILO RECIBO (ITENS) */}
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
                        {!["DONE", "CANCELED"].includes(detailOrder.status) && (
                          <button
                            onClick={() => cancelItem(item.id, !item.isCanceled)}
                            className={`p-1 rounded transition-all ${item.isCanceled ? "text-green-500 hover:bg-green-50" : "text-red-400 hover:bg-red-50"}`}
                          >
                            {item.isCanceled ? <RotateCcw size={12} /> : <Trash2 size={12} />}
                          </button>
                        )}
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

                    {detailOrder.observations && (
                      <div className="pt-3 border-t border-slate-200">
                        <div className="flex items-start gap-3">
                          <ScrollText size={14} className="text-purple-500 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1">Observações do Pedido</p>
                            <p className="text-[10px] text-slate-700 font-bold leading-relaxed italic">
                              "{detailOrder.observations}"
                            </p>
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

                          {(detailOrder.orderType === "DELIVERY" || deliveryFee > 0) && (
                            <div className="flex justify-between items-center text-slate-500">
                              <span className="text-[10px] font-bold uppercase tracking-wider">Taxa de Entrega {detailOrder.neighborhood ? `(${detailOrder.neighborhood})` : ""}</span>
                              <span className="text-xs font-black">{deliveryFee > 0 ? formatCurrency(deliveryFee) : "GRÁTIS"}</span>
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

                          {(detailOrder.paymentMethod?.toUpperCase() === "DINHEIRO" || detailOrder.paymentMethod?.toUpperCase() === "CASH") && detailOrder.change > 0 && (
                            <div className="mt-2 p-3 bg-purple-50 rounded-xl border border-purple-100 flex justify-between items-center">
                              <div>
                                <span className="text-[9px] font-black text-purple-400 block leading-none mb-1 uppercase">Pago com</span>
                                <span className="text-sm font-black text-slate-700">{formatCurrency(detailOrder.change)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-black text-purple-400 block leading-none mb-1 uppercase">Valor a Devolver</span>
                                <span className="text-lg font-black text-purple-600">{formatCurrency(Math.max(0, detailOrder.change - detailOrder.total))}</span>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => autoPrintOrder(detailOrder)}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Printer size={16} /> Imprimir Comanda
                  </button>
                  {["DONE", "CANCELED"].includes(detailOrder.status) && (
                    <button
                      onClick={() => { updateStatus(detailOrder.id, "PREPARING"); setDetailOrder(null); }}
                      className="px-6 bg-purple-100 text-purple-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-200 transition-all flex items-center gap-2 border border-purple-200"
                    >
                      <RotateCcw size={16} /> Reabrir
                    </button>
                  )}
                </div>
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

      {/* ===== MODAL: NOVA COMANDA DE MESA ===== */}
      {isCommandModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`bg-white border border-slate-200 w-full rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all ${isCheckoutStep ? "max-w-sm" : "max-w-5xl h-[85vh]"}`}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg"><ShoppingBag size={16} className="text-slate-900" /></div>
                <h3 className="font-black text-slate-900  text-xs tracking-widest">
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
                        className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-1 focus:ring-purple-500/30 placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pb-4 grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleProductClick(p)}
                        className="group bg-white border border-slate-200 p-2.5 rounded-lg text-left hover:border-purple-500/60 hover:shadow-md transition-all shadow-sm flex flex-col justify-between min-h-[100px]"
                      >
                        <div>
                          <div className="font-black text-slate-700 text-[10px]  tracking-tight mb-0.5 line-clamp-2 group-hover:text-purple-600 transition-colors leading-tight">{p.name}</div>
                          {(p.optiongroup && p.optiongroup.length > 0) && (
                            <div className="text-[8px] text-purple-500 font-bold ">Opcionais</div>
                          )}
                        </div>
                        <div className="mt-2 flex justify-between items-end">
                          <div className="flex flex-col">
                            {p.salePrice && p.salePrice < p.price && (
                              <span className="text-[8px] text-slate-400 line-through font-bold leading-none">{formatCurrency(p.price)}</span>
                            )}
                            <span className="font-black text-purple-600 text-xs leading-none">
                              {formatCurrency(p.salePrice && p.salePrice < p.price ? p.salePrice : p.price)}
                            </span>
                          </div>
                          <div className="p-1 bg-slate-100 text-slate-500 rounded group-hover:bg-purple-600 group-hover:text-white transition-all">
                            <Plus size={10} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CARRINHO */}
                <div className={`
                  fixed lg:static top-0 right-0 h-full z-[120] lg:z-auto
                  w-full sm:w-80 flex flex-col bg-white shrink-0 shadow-2xl lg:shadow-none
                  transition-transform duration-300
                  ${isInternalCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
                `}>
                  <div className="p-4 border-b border-slate-200 shrink-0 flex items-center justify-between">
                    <h4 className="font-black text-slate-500 text-[10px] tracking-widest">Carrinho ({internalCart.length})</h4>
                    <button className="lg:hidden p-2 text-slate-400" onClick={() => setIsInternalCartOpen(false)}>
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {internalCart.length === 0 ? (
                      <div className="h-full flex items-center justify-center opacity-20">
                        <div className="text-center">
                          <ShoppingBag size={32} className="mx-auto mb-2 text-slate-500" />
                          <p className="text-[9px] font-black text-slate-500 ">Carrinho vazio</p>
                        </div>
                      </div>
                    ) : internalCart.map(item => (
                      <div key={item.productId} className="flex items-center gap-3 p-3 bg-slate-50/60 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-slate-700  truncate">{item.productName}</p>
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
                      <span className="text-xs font-black text-slate-500 ">Subtotal</span>
                      <span className="text-lg font-black text-slate-900">{formatCurrency(cartTotal)}</span>
                    </div>
                    <button
                      disabled={internalCart.length === 0}
                      onClick={() => {
                        if (isAddingItems) {
                          finalizeInternalOrder();
                        } else if (storeInfo?.storeType === "RESTAURANT") {
                          setIsCheckoutStep(true);
                        } else {
                          // Venda direta finaliza direto
                          finalizeInternalOrder();
                        }
                      }}
                      className="w-full py-4 bg-purple-600 text-white rounded-xl font-black text-xs  tracking-widest hover:bg-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isAddingItems ? "Confirmar" : storeInfo?.storeType === "RESTAURANT" ? "Próxima Etapa" : "Finalizar Venda"} <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Overlay for mobile cart */}
                {isInternalCartOpen && (
                  <div
                    className="fixed inset-0 bg-black/60 z-[110] lg:hidden backdrop-blur-sm"
                    onClick={() => setIsInternalCartOpen(false)}
                  />
                )}

                {/* Floating Button for Mobile */}
                {!isInternalCartOpen && (
                  <div className="absolute bottom-4 left-4 right-4 lg:hidden z-40">
                    <button
                      onClick={() => setIsInternalCartOpen(true)}
                      className="w-full bg-purple-600 text-white flex items-center justify-between px-6 py-4 rounded-xl shadow-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white text-purple-600 flex items-center justify-center rounded-full font-black text-xs">
                          {internalCart.length}
                        </div>
                        <span className="font-black tracking-widest text-sm">Ver Carrinho</span>
                      </div>
                      <span className="font-black text-white text-lg">{formatCurrency(cartTotal)}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* CHECKOUT: SELECIONAR MESA E GARÇOM */
              <div className="p-6 space-y-5 overflow-y-auto">
                <div>
                  <label className="text-[10px] font-black text-slate-500  tracking-widest block mb-3">Selecionar Mesa</label>
                  <div className="grid grid-cols-4 gap-2">
                    {tables.filter(t => t.isActive).map(t => (
                      <button
                        key={t.id}
                        onClick={() => setInternalOrder(p => ({ ...p, tableId: t.id }))}
                        className={`p-4 rounded-xl border-2 font-black text-sm transition-all ${internalOrder.tableId === t.id ? "bg-purple-600 text-white border-purple-500 shadow-lg" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-500"}`}
                      >
                        {t.number}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500  tracking-widest block mb-3 uppercase">Garçom Responsável</label>
                  <div className="space-y-2">
                    {waiters.filter(w => w.isActive).map(w => (
                      <button
                        key={w.id}
                        onClick={() => setInternalOrder(p => ({ ...p, waiterId: w.id }))}
                        className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${internalOrder.waiterId === w.id ? "bg-purple-600/20 border-purple-500/50 ring-1 ring-purple-500/30" : "bg-slate-50/60 border-slate-200/50 hover:border-slate-300"}`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${internalOrder.waiterId === w.id ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                           <User size={18} />
                        </div>
                        <span className={`text-xs font-black  ${internalOrder.waiterId === w.id ? "text-purple-400" : "text-slate-500"}`}>{w.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500  tracking-widest block mb-3 uppercase">Observações da Mesa</label>
                  <textarea 
                    placeholder="Ex: Mesa de aniversário, levar gelo..."
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-bold outline-none focus:border-purple-500 min-h-[80px]"
                    value={internalOrder.observations || ""}
                    onChange={e => setInternalOrder(p => ({ ...p, observations: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsCheckoutStep(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-xl font-black text-xs  hover:bg-slate-100 transition-all">
                    Voltar
                  </button>
                  <button onClick={finalizeInternalOrder} className="flex-[2] py-4 bg-purple-600 text-white rounded-xl font-black text-xs  hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg">
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
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Settings size={18} className="text-purple-500" />
                <h3 className="font-black text-slate-900 text-sm tracking-widest">Configurações PDV</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 text-slate-500 hover:text-slate-900 transition-all"><X size={16} /></button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto">
              {/* Coluna 1: Notificações e Sons */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Alertas e Notificações</p>

                <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-700 ">Som de Notificação</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Toca ao chegar novo pedido</p>
                    </div>
                    <button
                      onClick={() => { const v = !soundEnabled; setSoundEnabled(v); saveSettings(v, autoPrint); }}
                      className={`w-12 h-6 rounded-full transition-all relative ${soundEnabled ? "bg-green-500" : "bg-slate-600"}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${soundEnabled ? "left-6" : "left-0.5"}`} />
                    </button>
                  </div>

                  {soundEnabled && (
                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-200/50 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {[1, 2, 3, 4, 5, 6].map((num) => {
                        const fileName = `notification${num === 1 ? "" : num}.mp3`;
                        const isSelected = notificationSound === fileName;
                        return (
                          <div key={fileName} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${isSelected ? "bg-purple-50 border-purple-200" : "bg-white border-slate-100 hover:border-slate-200"}`}>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => playNotification(fileName)}
                                className="p-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-all"
                              >
                                <Volume2 size={12} />
                              </button>
                              <span className="text-[10px] font-bold text-slate-600">Som {num}</span>
                            </div>
                            <button
                              onClick={() => {
                                setNotificationSound(fileName);
                                saveSettings(soundEnabled, autoPrint, fileName);
                              }}
                              className={`px-3 py-1 rounded text-[9px] font-black transition-all ${isSelected ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                            >
                              {isSelected ? "Ativo" : "Selecionar"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50/60 rounded-xl border border-slate-200/50">
                  <div>
                    <p className="text-xs font-black text-slate-700 ">Impressão Automática</p>
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

              {/* Coluna 2: Sistema e Interface (Electron Only) */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Sistema e Interface</p>

                <div className="space-y-4">
                  {typeof window !== 'undefined' && (window as any).require && (
                    <div className="flex items-center justify-between p-4 bg-slate-50/60 rounded-xl border border-slate-200/50">
                      <div>
                        <p className="text-xs font-black text-slate-700 ">Iniciar com o Windows</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Abrir sistema ao ligar o PC</p>
                      </div>
                      <button
                        onClick={() => {
                          const v = !autoStart;
                          setAutoStart(v);
                          const { ipcRenderer } = (window as any).require('electron');
                          ipcRenderer.send('toggle-autostart', v);
                          toast.success(v ? "Inicialização automática ativada" : "Inicialização automática desativada");
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${autoStart ? "bg-purple-500" : "bg-slate-600"}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${autoStart ? "left-6" : "left-0.5"}`} />
                      </button>
                    </div>
                  )}

                  {typeof window !== 'undefined' && (window as any).require && (
                    <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/50 space-y-3">
                      <p className="text-xs font-black text-slate-700 ">Zoom da Interface</p>
                      <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-100">
                        <button onClick={() => setZoomLevel(prev => Math.max(-2, prev - 0.2))} className="w-10 h-10 flex items-center justify-center bg-slate-50 border rounded-lg text-slate-500 hover:bg-slate-100 transition-all text-sm font-black">-</button>
                        <div className="flex-1 text-center font-black text-xs text-slate-600">
                          {Math.round((zoomLevel + 1) * 100)}%
                        </div>
                        <button onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.2))} className="w-10 h-10 flex items-center justify-center bg-slate-50 border rounded-lg text-slate-500 hover:bg-slate-100 transition-all text-sm font-black">+</button>
                      </div>
                    </div>
                  )}

                  {availablePrinters.length > 0 && (
                    <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/50 space-y-3">
                      <p className="text-xs font-black text-slate-700 ">Impressora Térmica</p>
                      <select
                        value={selectedPrinter}
                        onChange={(e) => {
                          setSelectedPrinter(e.target.value);
                          localStorage.setItem('thermal_printer_name', e.target.value);
                          toast.success("Impressora atualizada!");
                        }}
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/30 appearance-none cursor-pointer"
                      >
                        <option value="">Padrão do Sistema</option>
                        {availablePrinters.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name} {p.isDefault ? "(Padrão)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Fallback info if not in Electron */}
                  {!(typeof window !== 'undefined' && (window as any).require) && (
                    <div className="p-6 bg-slate-50/60 rounded-xl border border-slate-200/50 flex flex-col items-center text-center space-y-2">
                      <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                        <Monitor size={24} />
                      </div>
                      <p className="text-[10px] font-bold text-slate-500">
                        Acesse via App Desktop para habilitar configurações avançadas de sistema e hardware.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: CONFIRMAR FECHAMENTO DE CAIXA ===== */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Bell size={36} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Fechar Caixa?</h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  Esta ação irá encerrar o turno atual. Você receberá um relatório completo das vendas.
                </p>
              </div>
              {withdrawals.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-left">
                  <p className="text-xs font-bold text-amber-700 mb-1">Retiradas registradas:</p>
                  {withdrawals.map((w: any) => (
                    <div key={w.id} className="flex justify-between text-xs text-amber-600">
                      <span>{w.reason}</span>
                      <span className="font-black">- {formatCurrency(w.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => setShowCloseConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">
                Cancelar
              </button>
              <button
                onClick={() => manageCashier("CLOSE")}
                disabled={cashierLoading}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
              >
                {cashierLoading ? <Loader2 size={18} className="animate-spin" /> : "Fechar Caixa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: RELATÓRIO DE FECHAMENTO ===== */}
      {showCloseModal && closeReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Receipt size={30} className="text-white" />
              </div>
              <h3 className="text-xl font-black">Relatório de Fechamento</h3>
              <p className="text-purple-200 text-xs mt-1">
                {new Date(closeReport.openedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} → {new Date(closeReport.closedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Cards de métricas */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total de Pedidos", value: closeReport.totalOrders, color: "purple" },
                  { label: "Cancelamentos", value: closeReport.canceledOrders, color: "red" },
                  { label: "Delivery", value: closeReport.totalDelivery, color: "blue" },
                  { label: "Comandas", value: closeReport.totalComandas, color: "indigo" },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`p-4 bg-${color}-50 border border-${color}-100 rounded-2xl text-center`}>
                    <p className="text-2xl font-black text-slate-900">{value}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Formas de pagamento */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <p className="text-[10px] font-black text-slate-500 tracking-widest">FORMAS DE PAGAMENTO</p>
                {[
                  { label: "Dinheiro", value: closeReport.totalDinheiro, icon: "💵" },
                  { label: "Cartão", value: closeReport.totalCartao, icon: "💳" },
                  { label: "PIX", value: closeReport.totalPix, icon: "📱" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-2">{icon} {label}</span>
                      <span className="text-sm font-black text-slate-900">{formatCurrency(value)}</span>
                    </div>
                    {label === "Dinheiro" && closeReport.totalDeliveryFeesDinheiro > 0 && (
                      <div className="flex justify-between items-center pl-7 pr-1">
                        <span className="text-[10px] font-bold text-slate-400">↳ Somente Taxas de Entrega</span>
                        <span className="text-[10px] font-black text-slate-500">{formatCurrency(closeReport.totalDeliveryFeesDinheiro)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Retiradas */}
              {closeReport.withdrawals?.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <p className="text-[10px] font-black text-amber-700 tracking-widest">RETIRADAS DO CAIXA</p>
                  {closeReport.withdrawals.map((w: any) => (
                    <div key={w.id} className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-800 flex-1 truncate">{w.reason}</span>
                      <span className="text-xs font-black text-red-500 ml-2">- {formatCurrency(w.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Totais finais */}
              <div className="p-4 bg-slate-900 rounded-2xl space-y-2">
                <div className="flex justify-between text-white/60 text-xs">
                  <span>Total Bruto</span>
                  <span className="font-bold">{formatCurrency(closeReport.totalGeral)}</span>
                </div>
                {closeReport.totalWithdrawals > 0 && (
                  <div className="flex justify-between text-amber-400 text-xs">
                    <span>(-) Retiradas</span>
                    <span className="font-bold">- {formatCurrency(closeReport.totalWithdrawals)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white border-t border-white/10 pt-2 mt-2">
                  <span className="font-black text-sm">Total Líquido</span>
                  <span className="text-2xl font-black text-green-400">{formatCurrency(closeReport.totalLiquido)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex flex-col gap-3 bg-slate-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const w = window.open("", "_blank");
                    if (w) {
                      w.document.write(buildCashierReportHTML(closeReport, storeInfo));
                      w.document.close();
                      setTimeout(() => { w.print(); }, 500);
                    }
                  }}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Printer size={16} /> Imprimir Relatório
                </button>
                <button onClick={() => { setShowCloseModal(false); setCloseReport(null); }} className="flex-1 py-4 bg-slate-200 text-slate-500 rounded-2xl font-black text-xs hover:bg-slate-300 transition-all">
                  Voltar
                </button>
              </div>

              {cashier?.status === "OPEN" && (
                <button
                  onClick={() => {
                    setShowCloseModal(false);
                    setShowCloseConfirm(true);
                  }}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-red-500 transition-all shadow-lg shadow-red-500/20"
                >
                  Confirmar Fechamento de Caixa <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: RETIRADA DE CAIXA ===== */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                  <Banknote size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Retirada do Caixa</h3>
                  <p className="text-[10px] text-slate-400">Valor será subtraído do total</p>
                </div>
              </div>
              <button onClick={() => setShowWithdrawalModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {withdrawals.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 tracking-widest">Retiradas anteriores</p>
                  {withdrawals.map((w: any) => (
                    <div key={w.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-700 truncate flex-1">{w.reason}</span>
                      <span className="text-xs font-black text-red-500 ml-2">- {formatCurrency(w.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="text-[10px] font-black text-slate-500 tracking-widest block mb-2">MOTIVO DA RETIRADA *</label>
                <input
                  type="text"
                  placeholder="Ex: Pagamento de fornecedor..."
                  value={withdrawalReason}
                  onChange={e => setWithdrawalReason(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-bold outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 tracking-widest block mb-2">VALOR (R$) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  value={withdrawalAmount}
                  onChange={e => setWithdrawalAmount(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg text-slate-900 font-black outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>
              <button
                onClick={handleWithdrawal}
                disabled={withdrawalLoading}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50"
              >
                {withdrawalLoading ? <Loader2 size={18} className="animate-spin" /> : <><Banknote size={18} /> Registrar Retirada</>}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ===== MODAL: OPCIONAIS DE PRODUTOS ===== */}
      {selectedProductForOptions && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-900  text-xs tracking-widest">{selectedProductForOptions.name}</h3>
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
                        <h4 className="font-black text-xs text-slate-800  tracking-tight">{group.name}</h4>
                        <p className="text-[10px] font-bold text-slate-500">
                          {group.minOptions > 0 ? `Mín: ${group.minOptions}` : "Opcional"} • Máx: {group.maxOptions}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded ${selectedInGroup >= group.minOptions && selectedInGroup <= group.maxOptions ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>
                        {selectedInGroup}/{group.maxOptions}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.option.map((opt: any) => {
                        const isSelected = !!productOptionsSelection[opt.id];
                        return (
                          <label key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? "border-purple-500 bg-purple-50" : "border-slate-100 bg-white hover:border-slate-200"}`}>
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
                                        Object.keys(next).forEach(k => { if (next[k].groupId === group.id) delete next[k]; });
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
                                className="accent-purple-600 w-4 h-4"
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
              <button onClick={addToCartWithOptions} className="w-full py-4 bg-purple-500 text-white rounded-xl font-black text-xs  tracking-widest hover:bg-purple-600 transition-all flex items-center justify-between px-8 gap-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <Plus size={16} />
                  <span>Adicionar no Carrinho</span>
                </div>
                <span className="text-sm font-black">
                  R$ {(() => {
                    if (!selectedProductForOptions) return "0,00";
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

      {/* ===== MODAL: CHECKOUT DE MESA ===== */}
      {checkoutOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white border w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]">

            {/* LADO ESQUERDO: RESUMO DO PEDIDO */}
            <div className="lg:w-1/2 bg-slate-50 flex flex-col border-b lg:border-b-0 lg:border-r border-dashed border-slate-200">
              <div className="p-6 border-b bg-slate-100/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-xs tracking-widest uppercase">Resumo da Comanda</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      {checkoutOrder.orderType === "DINING_IN" ? `MESA ${checkoutOrder.table?.number}` : "PEDIDO EXTERNO"} • {checkoutOrder.customerName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-3">
                  {checkoutOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start pb-3 border-b border-slate-200/50 last:border-0">
                      <div className="flex gap-3">
                        <span className="text-xs font-black text-slate-400">{item.quantity}x</span>
                        <div>
                          <p className={`text-xs font-bold text-slate-800 ${item.isCanceled ? "line-through text-slate-400" : ""}`}>
                            {item.productName || item.product?.name}
                          </p>
                          {item.choices && <p className="text-[9px] text-slate-500 mt-0.5">+ {renderChoicesStr(item.choices)}</p>}
                        </div>
                      </div>
                      <span className={`text-xs font-black text-slate-900 ${item.isCanceled ? "line-through text-slate-300" : ""}`}>
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-slate-100/80 border-t border-dashed border-slate-200">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Subtotal de Itens</span>
                  <span className="text-xs font-black">
                    {formatCurrency(checkoutOrder.items?.reduce((acc: number, item: any) => acc + (item.isCanceled ? 0 : item.price * item.quantity), 0) || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: CHECKOUT E PAGAMENTO */}
            <div className="lg:w-1/2 p-8 flex flex-col justify-between bg-white relative">
              <button
                onClick={() => setCheckoutOrder(null)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"
              >
                <X size={20} />
              </button>

              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ajustes e Descontos</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tipo de Desconto</label>
                      <div className="flex gap-2">
                        <select
                          value={discountType}
                          onChange={e => setDiscountType(e.target.value as any)}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
                          className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Método de Pagamento</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[["DINHEIRO", Banknote], ["CARTÃO", CreditCard], ["PIX", Smartphone]].map(([m, Icon]: any) => (
                      <button
                        key={m}
                        onClick={() => setClosingPaymentMethod(m)}
                        className={`p-4 rounded-2xl font-black text-[10px] uppercase transition-all flex flex-col items-center gap-2 border-2 ${closingPaymentMethod === m ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm" : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"}`}
                      >
                        <Icon size={20} /> {m}
                      </button>
                    ))}
                  </div>
                </div>

                {closingPaymentMethod === "DINHEIRO" && (
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-3 animate-in slide-in-from-top duration-300">
                    <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest ml-1">Valor Pago pelo Cliente</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-purple-400 text-sm">R$</span>
                      <input 
                        type="number"
                        value={closingChangeValue}
                        onChange={e => setClosingChangeValue(e.target.value)}
                        className="w-full p-4 pl-12 bg-white border-2 border-purple-200 rounded-xl text-lg font-black text-purple-900 outline-none focus:ring-4 focus:ring-purple-500/10 transition-all"
                        placeholder="0,00"
                      />
                    </div>
                    {parseFloat(closingChangeValue) > 0 && (
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold text-purple-400 uppercase">Troco a Devolver</span>
                        <span className="text-sm font-black text-purple-600">
                          {formatCurrency(Math.max(0, parseFloat(closingChangeValue) - ((checkoutOrder.total + (checkoutOrder.deliveryFee || 0)) - (discountType === "FIXED" ? (parseFloat(discountValue) || 0) : (checkoutOrder.total * (parseFloat(discountValue) || 0)) / 100))))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Subtotal</span>
                    <span className="text-sm font-black">{formatCurrency(checkoutOrder.total)}</span>
                  </div>

                  {checkoutOrder.deliveryFee > 0 && (
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Taxa de Entrega</span>
                      <span className="text-sm font-black">{formatCurrency(checkoutOrder.deliveryFee)}</span>
                    </div>
                  )}

                  {(parseFloat(discountValue) > 0) && (
                    <div className="flex justify-between items-center text-red-500">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Desconto Aplicado</span>
                      <span className="text-sm font-black">
                        - {formatCurrency(discountType === "FIXED" ? (parseFloat(discountValue) || 0) : (checkoutOrder.total * (parseFloat(discountValue) || 0)) / 100)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end mb-8">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase block leading-none mb-1">Total a Receber</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{closingPaymentMethod}</span>
                    </div>
                  </div>
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">
                    {formatCurrency(Math.max(0, (checkoutOrder.total + (checkoutOrder.deliveryFee || 0)) - (discountType === "FIXED" ? (parseFloat(discountValue) || 0) : (checkoutOrder.total * (parseFloat(discountValue) || 0)) / 100)))}
                  </span>
                </div>

                <button
                  onClick={finalizeCheckout}
                  disabled={loading}
                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={22} />}
                  Finalizar e Fechar Comanda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

