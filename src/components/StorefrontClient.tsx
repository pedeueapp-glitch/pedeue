"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ShowcaseCatalog from "@/components/ShowcaseCatalog";
import ServiceCatalog from "@/components/ServiceCatalog";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  X,
  Trash2,
  Clock,
  MapPin,
  ChevronRight,
  AlertCircle,
  Loader2,
  Package,
  CheckCircle,
  Bike,
  ChevronDown,
  Info,
  MessageSquare,
  Phone,
  User,
  Home,
  CreditCard,
  Banknote,
  Navigation,
  ChevronLeft,
  Copy,
  QrCode,
  Star,
  Heart,
  Truck
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import { generatePixPayload, getPixQRCodeUrl } from "@/lib/pix-utils";

interface Option {
  id: string;
  name: string;
  price: number;
}

interface OptionGroup {
  id: string;
  name: string;
  minOptions: number;
  maxOptions: number;
  isRequired: boolean;
  priceCalculation?: "SUM" | "HIGHEST" | "AVERAGE";
  option: Option[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  inStock: boolean;
  optiongroup?: OptionGroup[];
  variants?: any[];
  salePrice?: number;
  isCombo?: boolean;
  comboConfig?: string;
  productType?: string;
}

interface Category {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  product: Product[];
}

interface DeliveryArea {
  id: string;
  neighborhood: string;
  fee: number;
}

interface StoreData {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  banner?: string;
  whatsapp: string;
  deliveryFee: number;
  deliveryTime?: string;
  minOrderValue: number;
  isOpen: boolean;
  isActive: boolean;
  primaryColor: string;
  storeType: string;
  category: Category[];
  deliveryarea: DeliveryArea[];
  openingHours?: string;
  showcaseBanners?: string;
  restaurantBanners?: string;
  serviceBanners?: string;
  pixKey?: string;
  freeDeliveryThreshold: number;
}

export default function StorefrontClient({ initialStore, slug }: { initialStore: any, slug: string }) {
  const [store, setStore] = useState<StoreData | null>(initialStore);
  const [loading, setLoading] = useState(!initialStore);
  const [notFound, setNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(initialStore?.category?.[0]?.id || null);
  const [cartOpen, setCartOpen] = useState(false);
  const [showStoreInfo, setShowStoreInfo] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [activeUpsellRuleId, setActiveUpsellRuleId] = useState<string | null>(null);

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{4})/, "$1-$2");
  };

  // Checkout Multi-Step
  const [checkoutStep, setCheckoutStep] = useState<"identify" | "register" | "payment" | "success">("identify");
  const [customer, setCustomer] = useState<any>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedProduct || cartOpen || showUpsell || showStoreInfo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedProduct, cartOpen, showUpsell, showStoreInfo]);

  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [selectedArea, setSelectedArea] = useState<DeliveryArea | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [changeAmount, setChangeAmount] = useState("");
  const [orderObservations, setOrderObservations] = useState("");

  const [registerForm, setRegisterForm] = useState({
    name: "",
    street: "",
    number: "",
    complement: "",
    reference: "",
    latitude: null as number | null,
    longitude: null as number | null
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [groupId: string]: Option[] }>({});
  const [productObservations, setProductObservations] = useState("");
  const [currentRestaurantBanner, setCurrentRestaurantBanner] = useState(0);

  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount, setStoreSlug, getItemQty } = useCartStore();
  const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer_data');
    if (savedCustomer) {
      try {
        const parsed = JSON.parse(savedCustomer);
        setCustomer(parsed);
        setPhoneInput(parsed.whatsapp || "");
        setRegisterForm({
          name: parsed.name || "",
          street: parsed.street || "",
          number: parsed.number || "",
          complement: parsed.complement || "",
          reference: parsed.reference || "",
          latitude: parsed.latitude || null,
          longitude: parsed.longitude || null
        });
      } catch (e) { console.error("Error loading saved customer", e); }
    }

    const params = new URLSearchParams(window.location.search);
    const affiliateCode = params.get("ref") || params.get("affiliate");
    if (affiliateCode) {
      localStorage.setItem(`affiliate_${slug}`, affiliateCode);
    }
  }, [slug]);


  const checkIsOpen = useCallback(() => {
    if (!store?.openingHours) return store?.isOpen ?? true;
    try {
      const hours = typeof store.openingHours === 'string' ? JSON.parse(store.openingHours) : store.openingHours;
      if (!Array.isArray(hours)) return store?.isOpen ?? true;

      const now = new Date();
      const dayName = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][now.getDay()];
      const currentDay = hours.find((h: any) => h.day.toLowerCase() === dayName);

      if (!currentDay || !currentDay.enabled) return false;

      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [openH, openM] = currentDay.open.split(":").map(Number);
      const [closeH, closeM] = currentDay.close.split(":").map(Number);

      const openTime = openH * 60 + openM;
      const closeTime = closeH * 60 + closeM;

      if (closeTime < openTime) {
        return currentTime >= openTime || currentTime <= closeTime;
      }

      return currentTime >= openTime && currentTime <= closeTime;
    } catch { return store?.isOpen ?? true; }
  }, [store]);

  const storeOpen = checkIsOpen();

  useEffect(() => {
    if (initialStore) {
      setStoreSlug(slug);
      return;
    }
    async function loadStore() {
      try {
        const res = await fetch(`/api/store/${slug}`);
        if (res.status === 403) {
          const data = await res.json();
          setStore(data);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setStore(data);
        setStoreSlug(slug);
        if (data.category && data.category.length > 0) {
          setActiveCategory(data.category[0].id);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, [slug, setStoreSlug, initialStore]);

  useEffect(() => {
    if (!store?.restaurantBanners) return;
    const banners = typeof store.restaurantBanners === 'string' ? JSON.parse(store.restaurantBanners || '[]') : (store.restaurantBanners || []);
    if (!Array.isArray(banners) || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentRestaurantBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [store?.restaurantBanners]);

  async function handleIdentify() {
    if (phoneInput.length < 8) return toast.error("Telefone inválido");
    setFormLoading(true);
    try {
      const res = await fetch(`/api/customers?phone=${phoneInput}&storeId=${store?.id}`);
      const data = await res.json();
      if (data) {
        setCustomer(data);
        setRegisterForm({
          name: data.name,
          street: data.street || "",
          number: data.number || "",
          complement: data.complement || "",
          reference: data.reference || "",
          latitude: data.latitude || null,
          longitude: data.longitude || null
        });
        localStorage.setItem('customer_data', JSON.stringify({ ...data, whatsapp: phoneInput }));
        setCheckoutStep("payment");
      } else {
        setCheckoutStep("register");
      }
    } catch {
      toast.error("Erro ao identificar cliente");
    } finally {
      setFormLoading(false);
    }
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização nÃ£o é suportada.");
      return;
    }
    setFormLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRegisterForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setFormLoading(false);
        toast.success("Localização capturada!");
      },
      () => {
        setFormLoading(false);
        toast.error("NÃ£o foi possível obter localização.");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  async function handleRegister() {
    if (!registerForm.name || !registerForm.street || !registerForm.number) {
      return toast.error("Preencha os campos obrigatórios (*)");
    }

    if (!store?.id) {
      return toast.error("Loja não carregada corretamente");
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...registerForm,
          phone: phoneInput,
          storeId: store?.id
        })
      });
      const data = await res.json();
      setCustomer(data);
      localStorage.setItem('customer_data', JSON.stringify({ ...data, whatsapp: phoneInput }));
      setCheckoutStep("payment");
    } catch {
      toast.error("Erro ao salvar cadastro");
    } finally {
      setFormLoading(false);
    }
  }

  async function finishOrder() {
    if (deliveryType === "DELIVERY" && !selectedArea) return toast.error("Selecione o bairro para entrega");
    if (paymentMethod === "dinheiro" && !changeAmount) return toast.error("Informe o troco");

    const affiliateCode = localStorage.getItem(`affiliate_${slug}`);

    setFormLoading(true);
    try {
      const res = await fetch("/api/orders/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          storeId: store?.id,
          customer: { ...customer, ...registerForm, phone: phoneInput },
          deliveryType,
          deliveryArea: selectedArea,
          paymentMethod,
          change: changeAmount,
          observations: orderObservations,
          affiliateCode,
          upsellRuleId: activeUpsellRuleId
        })
      });



      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao finalizar pedido");
      }

      const orderData = await res.json();
      setCheckoutStep("success");

      const msg = generateWhatsAppMessage(orderData.orderNumber);
      window.open(`https://wa.me/${store?.whatsapp}?text=${msg}`, "_blank");

      clearCart();
    } catch (error: any) {
      toast.error(error.message || "Erro ao finalizar pedido");
    } finally {
      setFormLoading(false);
    }
  }

  function handleProductClick(product: Product) {
    if (!product.inStock || !product.isActive) return;
    setSelectedProduct(product);
    setSelectedOptions({});
    setProductObservations("");
  }

  function handleOptionToggle(groupId: string, option: Option, group: OptionGroup) {
    const current = selectedOptions[groupId] || [];
    const isSelected = current.find(o => o.id === option.id);

    if (isSelected) {
      setSelectedOptions({
        ...selectedOptions,
        [groupId]: current.filter(o => o.id !== option.id)
      });
    } else {
      if (group.maxOptions === 1) {
        setSelectedOptions({ ...selectedOptions, [groupId]: [option] });
      } else if (current.length < group.maxOptions) {
        setSelectedOptions({ ...selectedOptions, [groupId]: [...current, option] });
      } else {
        toast.error(`Máximo de ${group.maxOptions} opções para ${group.name}`);
      }
    }
  }

  const [showUpsell, setShowUpsell] = useState<{ rule: any, product: any } | null>(null);

  function confirmAddWithPricing() {
    if (!selectedProduct) return;

    for (const group of selectedProduct.optiongroup || []) {
      const selected = selectedOptions[group.id] || [];
      if (group.isRequired && selected.length < group.minOptions) {
        toast.error(`Escolha ao menos ${group.minOptions} de ${group.name}`);
        return;
      }
    }

    const originalBasePrice = selectedProduct.salePrice || selectedProduct.price;
    let currentBasePrice = originalBasePrice;
    let sumOfAdicionais = 0;

    for (const group of selectedProduct.optiongroup || []) {
      const selected = selectedOptions[group.id] || [];
      if (selected.length === 0) continue;

      const calcType = group.priceCalculation || "SUM";
      if (calcType === "HIGHEST") {
        const highestOption = Math.max(...selected.map(o => Number(o.price)));
        if (highestOption > currentBasePrice) {
          currentBasePrice = highestOption;
        }
      } else if (calcType === "AVERAGE") {
        const sumOptions = selected.reduce((acc, opt) => acc + Number(opt.price), 0);
        const avg = (originalBasePrice + sumOptions) / (selected.length + 1);
        if (avg > currentBasePrice) {
          currentBasePrice = avg;
        }
      } else {
        sumOfAdicionais += selected.reduce((acc, opt) => acc + Number(opt.price), 0);
      }
    }

    const optionsText = Object.values(selectedOptions).flat().map(o => o.name).join(", ");

    let finalNotes = optionsText || "";

    if (selectedProduct.isCombo && selectedProduct.comboConfig) {
      try {
        const itemIds = JSON.parse(selectedProduct.comboConfig);
        const allProducts = store?.category.flatMap(c => c.product) || [];
        const comboProducts = allProducts.filter(p => itemIds.includes(p.id));
        const comboItemsText = comboProducts.map(p => p.name).join(" + ");
        finalNotes = `${comboItemsText}${finalNotes ? ' | ' + finalNotes : ''}`;
      } catch (e) { }
    }

    if (productObservations) {
      finalNotes += finalNotes ? ` | ${productObservations}` : productObservations;
    }

    const itemToAdd = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: currentBasePrice + sumOfAdicionais,
      imageUrl: selectedProduct.imageUrl,
      quantity: 1,
      notes: finalNotes || undefined,
      choices: Object.values(selectedOptions).flat()
    };

    addItem(itemToAdd);
    toast.success(`${selectedProduct.name} adicionado!`);

    const upsellRule = (store as any)?.upsell_rules?.find((r: any) => r.triggerProductId === selectedProduct.id);
    if (upsellRule) {
      const suggestProduct = store?.category.flatMap(c => c.product).find(p => p.id === upsellRule.suggestProductId);
      if (suggestProduct) {
        setShowUpsell({ rule: upsellRule, product: suggestProduct });
      }
    }

    setSelectedProduct(null);
  }


  const allStoreProducts = (store?.category?.flatMap(c => c.product) || []).filter(p => {
    const storeType = store?.storeType || 'RESTAURANT';
    return p.productType === storeType || (!p.productType && storeType === 'RESTAURANT');
  });
  const combos = allStoreProducts.filter(p => p.isCombo && p.isActive);

  const combosCategory = combos.length > 0 ? {
    id: "combos-auto",
    name: "Combos",
    emoji: "🔥",
    icon: "🔥",
    product: combos.filter(p =>
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  } : null;

  const filteredCategories = [
    ...(combosCategory && combosCategory.product.length > 0 ? [combosCategory] : []),
    ...(store?.category || [])
      .map((cat) => ({
        ...cat,
        product: cat.product.filter((p) => {
          const storeType = store?.storeType || 'RESTAURANT';
          const matchesType = p.productType === storeType || (!p.productType && storeType === 'RESTAURANT');
          return !p.isCombo &&
            matchesType &&
            p.isActive && (
              searchQuery === "" ||
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
            );
        })
      }))
      .filter((cat) => cat.product.length > 0)
  ];

  function generateWhatsAppMessage(orderNumber: number) {
    if (!store) return;
    const totalItems = getTotal();
    const isFreeShipping = store && store.freeDeliveryThreshold > 0 && totalItems >= store.freeDeliveryThreshold;
    const currentFee = deliveryType === "DELIVERY" ? (selectedArea ? (isFreeShipping ? 0 : selectedArea.fee) : 0) : 0;
    const discount = 0; // Se houver lógica de cupom no futuro, injetar aqui
    const deliveryTotal = totalItems + currentFee - discount;

    let msg = `*PEDIDO #${orderNumber || 'NOVO'} - ${store.name.toUpperCase()}*\n\n`;
    msg += `*Cliente:* ${registerForm.name}\n`;
    msg += `*Telefone:* ${phoneInput}\n\n`;

    if (deliveryType === "DELIVERY") {
      msg += `*ENTREGA EM:* ${registerForm.street}, ${registerForm.number}\n`;
      if (registerForm.complement) msg += `*Complemento:* ${registerForm.complement}\n`;
      msg += `*Bairro:* ${selectedArea?.neighborhood}\n`;
    } else {
      msg += `*RETIRADA NO LOCAL*\n`;
    }

    msg += `\n-------------------------------------\n`;
    msg += `*ITENS DO PEDIDO:*\n\n`;

    items.forEach((item) => {
      msg += `• *${item.quantity}x ${item.name}*\n`;
      msg += `  R$ ${(item.price * item.quantity).toFixed(2).replace(".", ",")}\n`;

      if (item.choices && Array.isArray(item.choices) && item.choices.length > 0) {
        msg += `  └ ${item.choices.map((c: any) => c.name).join(", ")}\n`;
      } else if (item.notes) {
        msg += `  _Nota: ${item.notes}_\n`;
      }
      msg += "\n";
    });

    msg += `-------------------------------------\n`;
    msg += `*RESUMO FINANCEIRO:*\n`;
    msg += `Subtotal: R$ ${totalItems.toFixed(2).replace(".", ",")}\n`;
    if (deliveryType === "DELIVERY") {
      msg += `Taxa de Entrega: R$ ${currentFee.toFixed(2).replace(".", ",")}\n`;
    }
    if (discount > 0) {
      msg += `Desconto: - R$ ${discount.toFixed(2).replace(".", ",")}\n`;
    }
    msg += `*TOTAL: R$ ${deliveryTotal.toFixed(2).replace(".", ",")}*\n\n`;

    msg += `*PAGAMENTO:* ${paymentMethod.toUpperCase()}\n`;
    if (paymentMethod === "dinheiro" && changeAmount) {
      const trocoVal = parseFloat(changeAmount) - deliveryTotal;
      if (trocoVal > 0) {
        msg += `Levar troco para: R$ ${parseFloat(changeAmount).toFixed(2).replace(".", ",")}\n`;
        msg += `*Troco:* R$ ${trocoVal.toFixed(2).replace(".", ",")}\n`;
      } else {
        msg += `*Troco:* Não necessário\n`;
      }
    }

    if (orderObservations) {
      msg += `\n*OBSERVAÇÕES:* ${orderObservations}\n`;
    }

    msg += `\n_Pedido realizado via PedeUe.com Delivery_`;

    return encodeURIComponent(msg);
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
    </div>
  );

  if (store && (store as any).isExpired) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8 text-center animate-fade-in">
        <div className="max-w-md">
          <div className="w-24 h-24 bg-red-50 border-4 border-red-100 rounded-none flex items-center justify-center mx-auto mb-8">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">Loja Temporariamente Offline</h1>
          <p className="text-slate-400 text-sm font-bold tracking-widest leading-relaxed">
            O estabelecimento <span className="text-slate-900">{(store as any).storeName}</span> está com o atendimento digital suspenso.
          </p>
          <div className="mt-12 h-1 bg-slate-100 w-20 mx-auto" />
        </div>
      </div>
    );
  }

  if (notFound || !store) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
      <div>
        <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-400">Loja não encontrada</h1>
      </div>
    </div>
  );

  if (store.storeType === "SHOWCASE") {
    const allProducts = store.category.flatMap(c =>
      c.product.map((p: any) => ({
        ...p,
        categoryId: c.id,
        variants: p.variants || []
      }))
    );
    const categories = store.category.map(c => ({ id: c.id, name: c.name, emoji: c.emoji }));
    return (
      <ShowcaseCatalog
        store={{
          name: store.name,
          logo: store.logo,
          coverImage: store.coverImage || store.banner,
          primaryColor: store.primaryColor,
          whatsapp: store.whatsapp,
          description: store.description,
          openingHours: store.openingHours,
          banners: typeof store.showcaseBanners === 'string' ? JSON.parse(store.showcaseBanners || '[]') : (store.showcaseBanners || [])
        }}
        products={allProducts}
        categories={categories}
      />
    );
  }

  if (store.storeType === "SERVICE") {
    const allProducts = store.category.flatMap(c =>
      c.product.map((p: any) => ({
        ...p,
        categoryId: c.id
      }))
    );
    const categories = store.category.map(c => ({ id: c.id, name: c.name, emoji: c.emoji }));
    return (
      <ServiceCatalog
        store={{
          name: store.name,
          logo: store.logo,
          coverImage: store.coverImage || store.banner,
          primaryColor: store.primaryColor,
          whatsapp: store.whatsapp,
          description: store.description,
          openingHours: store.openingHours,
          banners: typeof store.serviceBanners === 'string' ? JSON.parse(store.serviceBanners || '[]') : (store.serviceBanners || [])
        }}
        products={allProducts}
        categories={categories}
      />
    );
  }

  const cartCount = getItemCount();
  const subtotal = getTotal();
  const isFreeShipping = store && store.freeDeliveryThreshold > 0 && subtotal >= store.freeDeliveryThreshold;
  const currentFee = deliveryType === "DELIVERY" ? (selectedArea ? (isFreeShipping ? 0 : selectedArea.fee) : 0) : 0;
  const total = subtotal + currentFee;
  const primaryColor = store.primaryColor || "#f97316";

  return (
    <div className="min-h-screen bg-slate-50 pb-32" style={{ "--primary": primaryColor } as any}>
      <style dangerouslySetInnerHTML={{ __html: `
        .bg-brand { background-color: ${primaryColor} !important; }
        .text-brand { color: ${primaryColor} !important; }
        .border-brand { border-color: ${primaryColor} !important; }
        .input-sharp {
          width: 100%;
          background-color: white;
          border: 1px solid #f1f5f9;
          padding: 1rem;
          font-size: 1rem;
          letter-spacing: 0.05em;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }
        .input-sharp:focus {
          outline: none;
          border-color: ${primaryColor};
          background-color: #fff;
        }
      ` }} />

      <div className="relative">
        <div className="h-56 bg-slate-200 relative overflow-hidden">
          {(store.coverImage || store.banner) ? (
            <img src={store.coverImage || store.banner} className="w-full h-full object-cover" alt="banner" />
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: primaryColor, opacity: 0.8 }} />
          )}

          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-10">
          <div className="bg-white rounded-xl p-5 md:p-8 shadow-2xl border-b-4 border-brand">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white border-4 border-white -mt-12 md:-mt-16 shadow-xl overflow-hidden flex-shrink-0 rounded-lg relative z-20">
                {store.logo ? (
                  <img src={store.logo} className="w-full h-full object-cover" alt="logo" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200"><Package size={40} /></div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left min-w-0">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">{store.name}</h1>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">{store.description || "Bem-vindo ao nosso cardápio digital."}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 mt-6">
                  <button
                    onClick={() => setShowStoreInfo(true)}
                    className="flex items-center gap-2 hover:opacity-80 transition-all"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${storeOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    <span className="text-xs font-semibold text-slate-700">{storeOpen ? "Aberto Agora" : "Fechado"}</span>
                    <Clock size={14} className="text-slate-400" />
                  </button>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Bike size={16} className="text-brand" />
                    <span className="text-xs font-semibold">{store.deliveryTime || "40-60 min"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-6 md:mt-8 space-y-4 sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md pb-4 pt-2">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-brand transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="O que você procura hoje?"
            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-base font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
          />
        </div>

        {!searchQuery && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {filteredCategories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  categoryRefs.current[cat.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all rounded-xl whitespace-nowrap border-2 ${activeCategory === cat.id
                  ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                  : "bg-white border-white text-slate-500 hover:border-slate-200"
                  }`}
              >
                <span className="text-lg">{cat.emoji}</span>
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 space-y-20">
        {filteredCategories.map((cat) => (
          <section key={cat.id} ref={el => { (categoryRefs.current as any)[cat.id] = el; }} className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl">{cat.emoji}</span>
              <h2 className="text-lg font-bold text-slate-500 uppercase tracking-tight">{cat.name}</h2>
              <div className="h-[1px] flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cat.product.map((product) => {
                const qty = getItemQty(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="bg-white border border-slate-100 flex min-h-[120px] h-auto group cursor-pointer hover:shadow-2xl transition-all relative rounded-lg overflow-hidden"
                  >
                    <div className="w-24 h-full min-h-[120px] bg-slate-50 flex-shrink-0 overflow-hidden relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="p" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={32} /></div>
                      )}
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20">
                          <span className="text-[10px] text-white tracking-widest border border-white/20 px-3 py-1">Esgotado</span>
                        </div>
                      )}

                    </div>
                    <div className="flex-1 p-5 min-w-0 flex flex-col justify-between relative">
                      <div className="absolute top-0 right-0 flex flex-col items-end gap-1">
                        {(product as any).isBestSeller && (
                          <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl shadow-sm flex items-center gap-1 uppercase tracking-tighter">
                            <Star size={8} fill="currentColor" /> Mais Pedidos
                          </span>
                        )}
                        {(product as any).isFavorite && (
                          <span className="bg-pink-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl shadow-sm flex items-center gap-1 uppercase tracking-tighter">
                            <Heart size={8} fill="currentColor" /> Queridinho
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-base truncate tracking-tight">{product.name}</h3>
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed font-medium">{product.description}</p>
                        {product.isCombo && product.comboConfig && (
                          <p className="text-slate-900 text-xs mt-1 leading-tight flex flex-wrap gap-1">
                            <span className="opacity-50">Incluso:</span> {allStoreProducts.filter(p => {
                              try {
                                return JSON.parse(product.comboConfig || "[]").includes(p.id);
                              } catch (e) { return false; }
                            }).map(p => p.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-col">
                          {product.salePrice ? (
                            <>
                              <span className="text-xs text-slate-400 line-through font-medium">R$ {product.price.toFixed(2).replace(".", ",")}</span>
                              <span className="font-bold text-lg text-brand">R$ {product.salePrice.toFixed(2).replace(".", ",")}</span>
                            </>
                          ) : (
                            <span className="font-bold text-lg text-brand">R$ {product.price.toFixed(2).replace(".", ",")}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isMounted && qty > 0 && (
                            <div className="bg-slate-900 text-white px-3 py-1 text-xs font-semibold">{qty}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {isMounted && cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
          <div className="max-w-4xl mx-auto px-6">
            <button
              onClick={() => setCartOpen(true)}
              className="w-full flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl text-white bg-brand transition-all hover:opacity-90 active:scale-[0.98] shadow-2xl shadow-brand/20"
            >
              <div className="flex items-center gap-5">
                <div className="relative">
                  <ShoppingCart size={24} />
                  <span className="absolute -top-3 -right-3 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold">{cartCount}</span>
                </div>
                <div className="text-left leading-tight">
                  <p className="text-[10px] font-semibold opacity-80 uppercase tracking-widest">Ver Carrinho</p>
                  <p className="text-xl font-bold">R$ {total.toFixed(2).replace(".", ",")}</p>
                </div>
              </div>
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
          <div className="relative flex-1 flex flex-col overflow-hidden">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 z-50 w-12 h-12 bg-slate-900/10 hover:bg-slate-900/20 transition-all flex items-center justify-center rounded-full backdrop-blur-md"
            >
              <X size={24} className="text-slate-900" />
            </button>

            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              <div className="w-full md:w-[45%] h-48 md:h-full bg-slate-100 sticky top-0 md:relative z-10">
                {selectedProduct.imageUrl ? (
                  <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" alt="p" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50"><Package size={48} /></div>
                )}
              </div>
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex flex-col mb-4">
                  {selectedProduct.salePrice ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400 line-through font-medium">De R$ {selectedProduct.price.toFixed(2)}</span>
                      <span className="text-2xl font-bold text-brand">Por R$ {selectedProduct.salePrice.toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-brand">R$ {selectedProduct.price.toFixed(2)}</span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedProduct.name}</h2>
                <p className="text-slate-500 text-sm font-medium mb-4">{selectedProduct.description}</p>

                <div className="space-y-10">
                  {selectedProduct.optiongroup?.map((group: any) => {
                    const groupPriceCalc = group.priceCalculation || "SUM";
                    return (
                      <div key={group.id} className="border-l-4 p-4 border-brand bg-slate-50">
                        <div className="flex items-center gap-2 mb-4">
                          <h4 className="font-bold text-slate-900 text-sm">{group.name}</h4>
                        </div>
                        <div className="space-y-1">
                          {group.option.map((opt: any) => {
                            const active = (selectedOptions[group.id] || []).find(o => o.id === opt.id);
                            return (
                              <button
                                key={opt.id}
                                onClick={() => handleOptionToggle(group.id, opt, group)}
                                className={`w-full flex items-center justify-between p-3 border transition-all ${active ? "border-slate-900 bg-white" : "border-slate-100 bg-white/50"}`}
                              >
                                <span className="text-xs font-medium text-slate-700">{opt.name}</span>
                                <div className="flex items-center gap-3">
                                  {opt.price > 0 && <span className="text-xs font-semibold text-brand">+ R$ {opt.price.toFixed(2)}</span>}
                                  <div className={`w-4 h-4 border flex items-center justify-center ${active ? "bg-slate-900 border-slate-900" : "border-slate-200"}`}>
                                    {active && <CheckCircle size={10} className="text-white" />}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-10 space-y-3">
                  <p className="text-xs font-semibold text-slate-400">Observações do Produto</p>
                  <textarea
                    value={productObservations}
                    onChange={e => setProductObservations(e.target.value)}
                    placeholder="Ex: sem queijo, etc..."
                    className="w-full bg-slate-50 border border-slate-200 p-4 text-sm focus:outline-none focus:border-brand rounded-xl min-h-[80px]"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 md:p-10 border-t border-slate-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-20">
              <div className="max-w-4xl mx-auto">
                <button
                  onClick={confirmAddWithPricing}
                  disabled={!storeOpen}
                  className="w-full bg-brand text-white py-4 md:py-8 flex items-center justify-between px-8 md:px-16 hover:brightness-110 disabled:opacity-50 disabled:grayscale rounded-2xl md:rounded-3xl transition-all active:scale-[0.98] shadow-2xl shadow-brand/20"
                >
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">{storeOpen ? "Confirmar e" : "Loja"}</span>
                    <span className="font-black text-base md:text-xl">{storeOpen ? "Adicionar ao Pedido" : "Fechada"}</span>
                  </div>
                  <div className="flex flex-col items-end leading-tight">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">Total Item</span>
                    <span className="font-black text-xl md:text-3xl">R$ {(() => {
                      const originalBasePrice = selectedProduct.salePrice || selectedProduct.price;
                      let currentBasePrice = originalBasePrice;
                      let sumOfAdicionais = 0;
                      for (const group of selectedProduct.optiongroup || []) {
                        const selected = selectedOptions[group.id] || [];
                        if (selected.length === 0) continue;
                        const calcType = group.priceCalculation || "SUM";
                        if (calcType === "HIGHEST") {
                          const highestOption = Math.max(...selected.map(o => Number(o.price)));
                          if (highestOption > currentBasePrice) currentBasePrice = highestOption;
                        } else if (calcType === "AVERAGE") {
                          const sumOptions = selected.reduce((acc, opt) => acc + Number(opt.price), 0);
                          const avg = (originalBasePrice + sumOptions) / (selected.length + 1);
                          if (avg > currentBasePrice) currentBasePrice = avg;
                        } else {
                          sumOfAdicionais += selected.reduce((acc, opt) => acc + Number(opt.price), 0);
                        }
                      }
                      return (currentBasePrice + sumOfAdicionais).toFixed(2).replace('.', ',');
                    })()}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-left">

            <div className="p-8 border-b-2 border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {checkoutStep !== "identify" && (
                  <button onClick={() => setCheckoutStep(checkoutStep === "register" ? "identify" : checkoutStep === "payment" ? (customer ? "identify" : "register") : "identify")} className="text-slate-300 hover:text-navy"><ChevronLeft /></button>
                )}
                <h2 className="text-xl font-bold text-slate-900">
                  {checkoutStep === "identify" ? "Seu Pedido" : checkoutStep === "register" ? "Seu Cadastro" : checkoutStep === "payment" ? "Pagamento" : "Pronto!"}
                </h2>
              </div>
              <button onClick={() => setCartOpen(false)} className="w-10 h-10 flex items-center justify-center border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-400"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              {checkoutStep === "identify" && (
                <div className="space-y-8">
                  {store?.freeDeliveryThreshold > 0 && (
                    <div className="bg-brand/5 border border-brand/10 p-5 rounded-2xl animate-in slide-in-from-top duration-500">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                            <Truck size={16} className="text-brand" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {subtotal >= store.freeDeliveryThreshold
                              ? "🎉 Parabéns! A entrega será grátis!"
                              : `Faltam R$ ${(store.freeDeliveryThreshold - subtotal).toFixed(2).replace('.', ',')} para você não pagar a taxa de entrega!`}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-1 rounded">R$ {store.freeDeliveryThreshold.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand transition-all duration-700 ease-out"
                          style={{ width: `${Math.min((subtotal / store.freeDeliveryThreshold) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-slate-800 text-sm truncate">{item.name}</p>
                            <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-all"><X size={14} /></button>
                          </div>
                          <p className="text-xs text-slate-400 font-medium line-clamp-1 mt-1">{item.notes}</p>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-full px-2 py-1 shadow-sm">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand"><Minus size={14} /></button>
                              <span className="w-4 text-center text-xs font-semibold text-slate-700">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand"><Plus size={14} /></button>
                            </div>
                            <span className="font-bold text-sm text-brand">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-900 p-8 space-y-6 rounded-2xl">
                    {customer && customer.name ? (
                      <div className="space-y-6 text-center">
                        <div>
                          <p className="text-xs font-medium text-white/40 mb-1">Confirme seu pedido</p>
                          <h3 className="text-lg font-bold text-white">{customer.name}</h3>
                          <p className="text-2xl font-black text-brand mt-4">Total: R$ {total.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <button
                          onClick={() => setCheckoutStep("payment")}
                          className="w-full bg-brand py-6 text-xs font-bold text-white flex items-center justify-center gap-3 hover:brightness-110 transition-all rounded-2xl shadow-lg shadow-brand/20"
                        >
                          Continuar para Pagamento
                        </button>
                        <button onClick={() => { setCustomer(null); setPhoneInput(""); localStorage.removeItem('customer_data'); }} className="text-xs text-white/30 hover:text-white transition-all">Trocar de Conta</button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-white/60 mb-4 text-center">Identifique-se para continuar</p>
                        <div className="relative">
                          <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <input
                            placeholder="(00) 00000-0000"
                            className="w-full bg-white/5 border border-white/10 p-5 pl-14 text-sm text-white rounded-xl focus:border-brand outline-none"
                            value={maskPhone(phoneInput)}
                            onChange={e => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                          />
                        </div>
                        <button
                          onClick={handleIdentify}
                          disabled={formLoading}
                          className="w-full bg-brand py-6 text-xs font-bold text-white flex items-center justify-center gap-3 hover:brightness-110 transition-all rounded-2xl"
                        >
                          {formLoading ? <Loader2 className="animate-spin" /> : "Pagamento"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {checkoutStep === "register" && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 border border-slate-100 space-y-4 rounded-2xl">
                    <p className="text-xs font-bold text-slate-800">Informações Pessoais</p>
                    <input placeholder="SEU NOME COMPLETO *" className="input-sharp" value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value.toUpperCase() })} />
                    <div className="p-3 bg-white text-xs text-slate-400 border border-slate-50 rounded-xl">WhatsApp: {phoneInput}</div>
                  </div>

                  <div className="p-6 bg-slate-50 border border-slate-100 space-y-4 rounded-2xl">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-slate-800">Endereço de Entrega</p>
                      <button
                        onClick={getLocation}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ${registerForm.latitude ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                      >
                        <Navigation size={10} /> {registerForm.latitude ? 'Localização OK' : 'Usar GPS'}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="RUA *" className="input-sharp col-span-2" value={registerForm.street} onChange={e => setRegisterForm({ ...registerForm, street: e.target.value.toUpperCase() })} />
                      <input placeholder="Nº *" className="input-sharp" value={registerForm.number} onChange={e => setRegisterForm({ ...registerForm, number: e.target.value.toUpperCase() })} />
                    </div>
                    <input placeholder="COMPLEMENTO (APTO, BLOCO)" className="input-sharp" value={registerForm.complement} onChange={e => setRegisterForm({ ...registerForm, complement: e.target.value.toUpperCase() })} />
                    <input placeholder="PONTO DE REFERÊNCIA" className="input-sharp" value={registerForm.reference} onChange={e => setRegisterForm({ ...registerForm, reference: e.target.value.toUpperCase() })} />
                  </div>

                  <button
                    onClick={handleRegister}
                    disabled={formLoading}
                    className="w-full bg-slate-900 text-white py-6 text-xs font-bold hover:bg-brand transition-all flex items-center justify-center rounded-2xl shadow-lg"
                  >
                    {formLoading ? <Loader2 className="animate-spin" /> : "Salvar e Continuar"}
                  </button>
                </div>
              )}

              {checkoutStep === "payment" && (
                <div className="space-y-8 pb-10">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-800">Opção de Recebimento</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setDeliveryType("DELIVERY")} className={`py-5 text-sm font-bold border flex items-center justify-center gap-3 transition-all rounded-xl ${deliveryType === "DELIVERY" ? "border-brand bg-brand/5 text-slate-900 shadow-md" : "border-slate-100 text-slate-400"}`}><Bike size={18} /> Entrega</button>
                      <button onClick={() => setDeliveryType("PICKUP")} className={`py-5 text-sm font-bold border flex items-center justify-center gap-3 transition-all rounded-xl ${deliveryType === "PICKUP" ? "border-brand bg-brand/5 text-slate-900 shadow-md" : "border-slate-100 text-slate-400"}`}><Package size={18} /> Retirada</button>
                    </div>

                    {deliveryType === "DELIVERY" && (
                      <div className="space-y-3">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[10px] font-bold text-brand uppercase">Entregar em:</p>
                              <p className="text-sm font-bold text-slate-900">{registerForm.street}, {registerForm.number}</p>
                            </div>
                            <button onClick={() => setCheckoutStep("register")} className="text-xs font-bold text-brand border-b border-brand">Alterar</button>
                          </div>
                        </div>
                        <select
                          className="w-full bg-slate-50 border border-slate-100 p-4 text-sm font-bold focus:border-brand outline-none rounded-xl"
                          onChange={e => setSelectedArea(store?.deliveryarea.find((a: any) => a.id === e.target.value) || null)}
                          value={selectedArea?.id || ""}
                        >
                          <option value="">Selecione o Bairro...</option>
                          {store?.deliveryarea.map((area: any) => (
                            <option key={area.id} value={area.id}>{area.neighborhood} - R$ {area.fee.toFixed(2).replace('.', ',')}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-800">Pagar com:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {["pix", "cartão", "dinheiro"].map(method => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`flex flex-col items-center justify-center gap-3 p-6 border rounded-xl text-xs font-bold transition-all ${paymentMethod === method ? "border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300"}`}
                        >
                          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                            {method === "pix" ? (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={paymentMethod === method ? "fill-white" : "fill-slate-400"}>
                                <path d="M11.642 1.342a.5.5 0 01.716 0l2.585 2.586a.5.5 0 010 .707l-2.585 2.585a.5.5 0 01-.708 0L9.065 4.635a.5.5 0 010-.707L11.642 1.342zM15.467 5.167a.5.5 0 01.708 0l2.585 2.586a.5.5 0 010 .707l-2.586 2.585a.5.5 0 01-.707 0l-2.586-2.585a.5.5 0 010-.708l2.586-2.585zM8.533 5.167a.5.5 0 010 .708L5.948 8.46a.5.5 0 01-.707 0L2.656 5.874a.5.5 0 010-.707l2.585-2.586a.5.5 0 01.707 0l2.585 2.586zM11.642 22.658a.5.5 0 00.716 0l2.585-2.586a.5.5 0 000-.707l-2.585-2.585a.5.5 0 00-.708 0l-2.585 2.586a.5.5 0 000 .707l2.585 2.585zM22.658 11.642a.5.5 0 000 .716l-2.586 2.585a.5.5 0 00-.707 0l-2.585-2.585a.5.5 0 000-.708l2.585-2.585a.5.5 0 00.707 0l2.586 2.585zM1.342 11.642a.5.5 0 010 .716l2.586 2.585a.5.5 0 01.707 0l2.585-2.585a.5.5 0 010-.708l-2.585-2.585a.5.5 0 01-.707 0L1.342 11.642z" fill="currentColor" />
                                <path d="M12.358 8.455a.5.5 0 00-.716 0l-3.182 3.182a.5.5 0 000 .716l3.182 3.182a.5.5 0 00.716 0l3.182-3.182a.5.5 0 000-.716l-3.182-3.182z" fill="currentColor" />
                              </svg>
                            ) : method === "cartão" ? <CreditCard size={24} /> : <Banknote size={24} />}
                          </div>
                          {method.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    {paymentMethod === "pix" && store?.pixKey && (
                      <div className="p-4 bg-green-50 border border-green-100 rounded-2xl animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1">Chave Pix:</p>
                            <p className="text-sm font-black text-slate-900 truncate">{store.pixKey}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(store.pixKey || "");
                              toast.success("Chave Copiada!");
                            }}
                            className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-md active:scale-95"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                        <p className="text-[9px] text-green-600 mt-2 font-medium italic">* Após o pagamento, envie o comprovante.</p>
                      </div>
                    )}
                    {paymentMethod === "dinheiro" && (
                      <div className="p-6 bg-purple-50 border border-purple-100 rounded-2xl animate-in slide-in-from-top duration-300">
                        <p className="text-[10px] font-bold text-purple-800 mb-3 tracking-widest">Troco para quanto?</p>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-purple-900 text-sm">R$</span>
                          <input
                            placeholder="EX: 100"
                            type="number"
                            value={changeAmount}
                            onChange={e => setChangeAmount(e.target.value)}
                            className="w-full bg-white border-2 border-purple-200 p-4 pl-12 text-sm font-bold text-purple-900 focus:outline-none rounded-xl"
                          />
                        </div>
                        {changeAmount && (
                          <p className="text-[11px] font-bold text-purple-700 mt-4">Cálculo do troco: <span className="font-bold underline">R$ {(parseFloat(changeAmount) - total).toFixed(2).replace('.', ',')}</span></p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-800">Observações Finais</p>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-100 p-5 text-xs font-bold min-h-[100px] focus:outline-none focus:border-brand italic-none rounded-xl"
                      placeholder="Deseja adicionar algo ao pedido?"
                      value={orderObservations}
                      onChange={e => setOrderObservations(e.target.value)}
                    />
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex justify-between text-2xl font-black text-slate-900 tracking-tighter">
                      <span>TOTAL FINAL</span>
                      <span className="text-brand">R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button
                      onClick={finishOrder}
                      disabled={formLoading || !storeOpen}
                      className="w-full bg-slate-900 text-white py-6 rounded-xl text-xs font-black tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-brand transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                    >
                      {formLoading ? <Loader2 className="animate-spin" /> : storeOpen ? "Concluir e Enviar" : "Loja Fechada"}
                      {storeOpen && !formLoading && <ChevronRight size={20} />}
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === "success" && (
                <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-8 animate-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                    <CheckCircle size={48} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Pedido Realizado!</h2>
                    <p className="text-slate-400 font-medium text-sm mt-4">Seu pedido já está no sistema da nossa loja e estamos preparando tudo com carinho.</p>
                  </div>
                  <button
                    onClick={() => window.open(`https://wa.me/${store?.whatsapp}?text=${generateWhatsAppMessage(0)}`, "_blank")}
                    className="w-full py-5 bg-navy text-white text-[10px] font-black tracking-widest hover:bg-brand transition-all flex items-center justify-center gap-3 rounded-xl shadow-xl"
                  >
                    Reenviar via WhatsApp
                  </button>
                  <button onClick={() => window.location.reload()} className="text-xs font-black text-brand border-b border-brand tracking-widest">Fazer outro pedido</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showUpsell && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative h-48 bg-slate-100">
              {showUpsell.product.imageUrl ? (
                <img src={showUpsell.product.imageUrl} className="w-full h-full object-cover" alt="upsell" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={48} /></div>
              )}
              <div className="absolute top-4 right-4">
                <button onClick={() => setShowUpsell(null)} className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/40 transition-all"><X size={20} /></button>
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-6 py-2 rounded-full text-[10px] font-black tracking-widest shadow-xl">
                Oferta Especial 🔥
              </div>
            </div>
            <div className="p-10 pt-12 text-center space-y-6">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-2">Já que você levou o outro...</h3>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 tracking-widest mb-1">Preço Exclusivo</p>
                  <p className="text-3xl font-black text-purple-600">R$ {(showUpsell.rule.discountPrice || showUpsell.product.price).toFixed(2).replace('.', ',')}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-4">
                  <button
                    onClick={() => {
                      addItem({
                        productId: showUpsell.product.id,
                        name: showUpsell.product.name,
                        price: showUpsell.rule.discountPrice || showUpsell.product.price,
                        imageUrl: showUpsell.product.imageUrl,
                        quantity: 1,
                        isUpsell: true
                      });
                      setActiveUpsellRuleId(showUpsell.rule.id);
                      toast.success("Excelente escolha!");
                      setShowUpsell(null);
                    }}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl text-xs font-black tracking-widest hover:bg-purple-500 transition-all shadow-xl active:scale-95"
                  >
                    Sim, eu quero!
                  </button>
                  <button
                    onClick={() => setShowUpsell(null)}
                    className="w-full py-4 text-slate-400 text-[10px] font-black tracking-widest hover:text-slate-600 transition-all"
                  >
                    Não, obrigado
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStoreInfo && (

        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowStoreInfo(false)}>
          <div className="bg-white w-full max-w-sm rounded-xl p-8 animate-in zoom-in-95 duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black text-slate-900 tracking-tighter mb-6 text-center">Horários de Funcionamento</h2>
            <div className="space-y-1">
              {(() => {
                const hours = typeof store?.openingHours === 'string' ? JSON.parse(store.openingHours || '[]') : (store?.openingHours || []);
                if (Array.isArray(hours) && hours.length > 0) {
                  return hours.map((h: any) => (
                    <div key={h.day} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 px-1">
                      <span className="text-[10px] font-black text-slate-400">{h.day}</span>
                      <span className={`text-[10px] font-black ${h.enabled ? 'text-slate-800' : 'text-red-300'}`}>
                        {h.enabled ? `${h.open} - ${h.close}` : 'Fechado'}
                      </span>
                    </div>
                  ));
                }
                return <p className="text-slate-300 text-[10px] font-black text-center">Configurações não encontradas</p>;
              })()}
            </div>
            <button
              onClick={() => setShowStoreInfo(false)}
              className="w-full mt-8 py-4 bg-slate-900 text-white text-[10px] font-black tracking-widest rounded-xl hover:opacity-90 transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-sharp {
           width: 100%;
           background-color: white;
           border: 1px solid #e2e8f0;
           padding: 0.85rem 1rem;
           font-size: 16px;
           font-weight: 700;
           text-transform:;
           outline: none;
           transition: all 0.2s;
           border-radius: 8px;
        }
        .input-sharp:focus {
           border-color: ${primaryColor};
           background-color: #f8fafc;
           box-shadow: 0 0 0 4px ${primaryColor}10;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; }
      `}</style>
    </div>
  );
}




