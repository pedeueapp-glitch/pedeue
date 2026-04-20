"use client";

import { useState, useEffect, useRef } from "react";
import ShowcaseCatalog from "@/components/ShowcaseCatalog";
import { useParams } from "next/navigation";
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
  ChevronLeft
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

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
}

export default function StorefrontPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [showStoreInfo, setShowStoreInfo] = useState(false);
  
  // Checkout Multi-Step
  const [checkoutStep, setCheckoutStep] = useState<"identify" | "register" | "payment" | "success">("identify");
  const [customer, setCustomer] = useState<any>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  
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
    reference: ""
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [groupId: string]: Option[] }>({});
  const [productObservations, setProductObservations] = useState("");

  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount, setStoreSlug, getItemQty } = useCartStore();
  const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
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
  }, [slug, setStoreSlug]);

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
          reference: data.reference || ""
        });
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
          observations: orderObservations
        })
      });

      if (!res.ok) throw new Error();
      
      const orderData = await res.json();
      setCheckoutStep("success");
      
      // WhatsApp Redirect
      const msg = generateWhatsAppMessage(orderData.orderNumber);
      window.open(`https://wa.me/${store?.whatsapp}?text=${msg}`, "_blank");
      
      clearCart();
    } catch {
      toast.error("Erro ao finalizar pedido");
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

  function confirmAddWithPricing() {
    if (!selectedProduct) return;

    for (const group of selectedProduct.optiongroup || []) {
      const selected = selectedOptions[group.id] || [];
      if (group.isRequired && selected.length < group.minOptions) {
        toast.error(`Escolha ao menos ${group.minOptions} de ${group.name}`);
        return;
      }
    }

    const optionsPrice = Object.values(selectedOptions).flat().reduce((sum, opt) => sum + opt.price, 0);
    const optionsText = Object.values(selectedOptions).flat().map(o => o.name).join(", ");
    
    let finalNotes = optionsText ? `Opcionais: ${optionsText}` : "";
    if (productObservations) {
      finalNotes += finalNotes ? ` | Obs: ${productObservations}` : `Obs: ${productObservations}`;
    }

    addItem({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price + optionsPrice,
      imageUrl: selectedProduct.imageUrl,
      quantity: 1,
      notes: finalNotes || undefined,
      choices: Object.values(selectedOptions).flat()
    });

    toast.success(`${selectedProduct.name} adicionado!`);
    setSelectedProduct(null);
  }

  const filteredCategories = store?.category?.map((cat) => ({
    ...cat,
    product: cat.product.filter((p) =>
      p.isActive && (
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ),
  })).filter((cat) => cat.product.length > 0) ?? [];

  function generateWhatsAppMessage(orderNumber: number) {
    if (!store) return;
    const totalItems = getTotal();
    const currentFee = deliveryType === "DELIVERY" ? (selectedArea ? selectedArea.fee : 0) : 0;
    const deliveryTotal = totalItems + currentFee;

    let msg = `🛒 *PEDIDO #${orderNumber} - ${store.name.toUpperCase()}*\n\n`;
    msg += `👤 *Cliente:* ${registerForm.name}\n`;
    msg += `📱 *Telefone:* ${phoneInput}\n\n`;
    
    if (deliveryType === "DELIVERY") {
      msg += `📍 *ENTREGA EM:* ${registerForm.street}, ${registerForm.number}\n`;
      if (registerForm.complement) msg += `🏢 *Complemento:* ${registerForm.complement}\n`;
      msg += `🏘️ *Bairro:* ${selectedArea?.neighborhood}\n`;
    } else {
      msg += `🏪 *RETIRADA NO LOCAL*\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🛍️ *ITENS DO PEDIDO:*\n\n`;

    items.forEach((item) => {
      msg += `• *${item.quantity}x ${item.name}*\n`;
      msg += `  R$ ${(item.price * item.quantity).toFixed(2).replace(".", ",")}\n`;
      
      // Formata os opcionais de forma bonita se existirem
      if (item.choices && Array.isArray(item.choices) && item.choices.length > 0) {
        msg += `  (+) ${item.choices.map((c: any) => c.name).join(", ")}\n`;
      } else if (item.notes) {
        // Fallback para o campo notes se não houver choices estruturados
        msg += `  _Nota: ${item.notes}_\n`;
      }
      msg += "\n";
    });

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💵 *Subtotal:* R$ ${totalItems.toFixed(2).replace(".", ",")}\n`;
    if (deliveryType === "DELIVERY") {
       msg += `🚗 *Taxa:* R$ ${currentFee.toFixed(2).replace(".", ",")}\n`;
    }
    msg += `💰 *TOTAL: R$ ${deliveryTotal.toFixed(2).replace(".", ",")}*\n\n`;
    
    msg += `💳 *PAGAMENTO:* ${paymentMethod.toUpperCase()}\n`;
    if (paymentMethod === "dinheiro" && changeAmount) {
      const trocoVal = parseFloat(changeAmount) - deliveryTotal;
      msg += `💵 *Dinheiro:* R$ ${parseFloat(changeAmount).toFixed(2)}\n`;
      msg += `🔙 *Troco:* R$ ${trocoVal.toFixed(2).replace(".", ",")}\n`;
    }
    
    if (orderObservations) {
       msg += `\n📝 *OBS DO PEDIDO:* ${orderObservations}\n`;
    }

    msg += `\n_Pedido realizado via Cardápio Digital_`;

    return encodeURIComponent(msg);
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
    </div>
  );

  if (store && (store as any).isExpired) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8 text-center animate-fade-in">
        <div className="max-w-md">
          <div className="w-24 h-24 bg-red-50 border-4 border-red-100 rounded-none flex items-center justify-center mx-auto mb-8">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Loja Temporariamente Offline</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
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

  // MODO VITRINE: Layout completamente diferente para lojas de moda/acessórios
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
          description: store.description
        }}
        products={allProducts}
        categories={categories}
      />
    );
  }

  const cartCount = getItemCount();
  const subtotal = getTotal();
  const currentFee = deliveryType === "DELIVERY" ? (selectedArea ? selectedArea.fee : 0) : 0;
  const total = subtotal + currentFee;
  const primaryColor = store.primaryColor || "#f97316";

  return (
    <div className="min-h-screen bg-slate-50 pb-32" style={{ "--primary": primaryColor } as any}>
      <style jsx global>{`
        .bg-brand { background-color: ${primaryColor} !important; }
        .text-brand { color: ${primaryColor} !important; }
        .border-brand { border-color: ${primaryColor} !important; }
      `}</style>

      {/* Banner & Header */}
      <div className="relative">
        <div className="h-56 bg-slate-200 relative overflow-hidden">
          {store.banner ? (
            <img src={store.banner} className="w-full h-full object-cover" alt="banner" />
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: primaryColor, opacity: 0.8 }} />
          )}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-white rounded-none p-8 shadow-2xl border-b-4 border-brand">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-28 h-28 bg-white border-4 border-white -mt-20 shadow-xl overflow-hidden flex-shrink-0 rounded-none">
                {store.logo ? (
                  <img src={store.logo} className="w-full h-full object-cover" alt="logo" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200"><Package size={40} /></div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left min-w-0">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{store.name}</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">{store.description || "Bem-vindo ao nosso cardápio digital."}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6">
                   <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${store.isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-700">{store.isOpen ? "Aberto Agora" : "Fechado"}</span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-700">
                      <Bike size={16} className="text-brand" />
                      <span className="text-xs font-black uppercase tracking-widest">{store.deliveryTime || "40-60 min"}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="relative mb-8">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="PROCURANDO ALGO ESPECIAL?"
            className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-none shadow-sm focus:outline-none transition-all text-xs font-black uppercase tracking-widest italic-none"
            style={{ borderLeftColor: primaryColor, borderLeftWidth: "6px" }}
          />
        </div>

        {!searchQuery && (
          <div className="sticky top-4 z-40 bg-white shadow-xl border border-slate-100 overflow-x-auto no-scrollbar rounded-none mb-12">
            <div className="flex whitespace-nowrap p-1">
              {store.category.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    categoryRefs.current[cat.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`flex items-center gap-3 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-4 ${
                    activeCategory === cat.id ? "text-slate-900" : "text-slate-300 border-transparent hover:text-slate-500"
                  }`}
                  style={{ borderBottomColor: activeCategory === cat.id ? primaryColor : "transparent" }}
                >
                  <span className="text-xl">{cat.icon || cat.emoji}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-20">
          {filteredCategories.map((cat) => (
            <section key={cat.id} ref={el => categoryRefs.current[cat.id] = el} className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl">{cat.icon || cat.emoji}</span>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{cat.name}</h2>
                <div className="h-1 flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cat.product.map((product) => {
                  const qty = getItemQty(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="bg-white border border-slate-100 flex h-36 group cursor-pointer hover:shadow-2xl transition-all relative rounded-none"
                    >
                      <div className="w-36 h-full bg-slate-50 flex-shrink-0 overflow-hidden relative rounded-none">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="p" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={32} /></div>
                        )}
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest border border-white/20 px-3 py-1">Esgotado</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-5 min-w-0 flex flex-col justify-between">
                         <div>
                            <h3 className="font-black text-slate-900 uppercase text-sm truncate tracking-tight">{product.name}</h3>
                            <p className="text-slate-400 text-[11px] mt-1 line-clamp-2 leading-relaxed font-medium">{product.description}</p>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="font-black text-lg text-brand">R$ {product.price.toFixed(2).replace(".", ",")}</span>
                            {qty > 0 && (
                               <div className="bg-slate-900 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">{qty}</div>
                            )}
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 animate-slide-up">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setCartOpen(true)}
              className="w-full flex items-center justify-between p-6 rounded-none text-white bg-brand transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <div className="flex items-center gap-5">
                <div className="relative">
                   <ShoppingCart size={24} />
                   <span className="absolute -top-3 -right-3 w-6 h-6 bg-slate-900 text-white rounded-none flex items-center justify-center text-[10px] font-black tracking-tight">{cartCount}</span>
                </div>
                <div className="text-left leading-tight">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Ver Carrinho</p>
                   <p className="text-xl font-black">R$ {total.toFixed(2).replace(".", ",")}</p>
                </div>
              </div>
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Adicionais */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
           <div className="bg-white w-full max-w-2xl h-full max-h-[800px] flex flex-col rounded-none shadow-2xl relative animate-scale-up overflow-hidden" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/10 backdrop-blur-lg hover:bg-slate-100 transition-all flex items-center justify-center border border-slate-100"
              >
                <X size={24} className="text-slate-900" />
              </button>
              
              <div className="flex-1 overflow-y-auto flex flex-col sm:flex-row">
                 <div className="w-full sm:w-[35%] h-56 sm:h-auto bg-slate-100">
                    {selectedProduct.imageUrl ? (
                      <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" alt="p" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={48} /></div>
                    )}
                 </div>
                 <div className="flex-1 p-8 overflow-y-auto">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">{selectedProduct.name}</h2>
                    <p className="text-slate-400 text-sm font-medium mb-10">{selectedProduct.description}</p>
                    <div className="space-y-10">
                       {selectedProduct.optiongroup?.map((group: any) => (
                          <div key={group.id} className="border-l-4 p-4 border-brand bg-slate-50">
                             <h4 className="font-black text-slate-900 uppercase text-sm mb-4">{group.name}</h4>
                             <div className="space-y-1">
                                {group.option.map((opt: any) => {
                                   const active = (selectedOptions[group.id] || []).find(o => o.id === opt.id);
                                   return (
                                      <button 
                                         key={opt.id}
                                         onClick={() => handleOptionToggle(group.id, opt, group)}
                                         className={`w-full flex items-center justify-between p-3 border transition-all ${active ? "border-slate-900 bg-white" : "border-slate-100 bg-white/50"}`}
                                      >
                                         <span className="text-[11px] font-bold uppercase tracking-tight text-slate-600">{opt.name}</span>
                                         <div className="flex items-center gap-3">
                                            {opt.price > 0 && <span className="text-[10px] font-black text-brand">+ R$ {opt.price.toFixed(2)}</span>}
                                            <div className={`w-4 h-4 border flex items-center justify-center ${active ? "bg-slate-900 border-slate-900" : "border-slate-200"}`}>
                                               {active && <CheckCircle size={10} className="text-white" />}
                                            </div>
                                         </div>
                                      </button>
                                   );
                                })}
                             </div>
                          </div>
                       ))}
                    </div>
                    <div className="mt-10 space-y-3">
                       <p className="text-[10px] font-black uppercase text-slate-300">Observações do Produto</p>
                       <textarea 
                          value={productObservations}
                          onChange={e => setProductObservations(e.target.value)}
                          placeholder="Ex: sem queijo, etc..."
                          className="w-full bg-slate-50 border border-slate-100 p-4 text-xs font-bold uppercase focus:outline-none focus:border-brand rounded-none min-h-[80px]"
                       />
                    </div>
                 </div>
              </div>
              <div className="p-8 border-t border-slate-50 bg-slate-50">
                 <button 
                    onClick={confirmAddWithPricing}
                    className="w-full bg-brand text-white py-5 flex items-center justify-between px-10 hover:brightness-110"
                 >
                    <span className="font-black uppercase text-sm">Adicionar</span>
                    <span className="font-black text-lg">R$ {(selectedProduct.price + Object.values(selectedOptions).flat().reduce((sum, o) => sum + o.price, 0)).toFixed(2)}</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Sidebar Carrinho Multi-Step */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
           <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-left">
              
              {/* Header do Checkout */}
              <div className="p-8 border-b-2 border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    {checkoutStep !== "identify" && (
                       <button onClick={() => setCheckoutStep(checkoutStep === "register" ? "identify" : checkoutStep === "payment" ? (customer ? "identify" : "register") : "identify")} className="text-slate-300 hover:text-navy"><ChevronLeft /></button>
                    )}
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                       {checkoutStep === "identify" ? "Seu Pedido" : checkoutStep === "register" ? "Seu Cadastro" : checkoutStep === "payment" ? "Finalização" : "Pronto!"}
                    </h2>
                 </div>
                 <button onClick={() => setCartOpen(false)} className="w-10 h-10 flex items-center justify-center border border-slate-100"><X size={20} /></button>
              </div>

              {/* Conteúdo do Checkout */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                 {checkoutStep === "identify" && (
                    <div className="space-y-8">
                       <div className="space-y-4">
                          {items.map(item => (
                            <div key={item.id} className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                               <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                     <p className="font-black text-slate-800 uppercase text-xs truncate">{item.name}</p>
                                     <button onClick={() => removeItem(item.productId)} className="text-slate-300 hover:text-red-500 transition-all"><X size={14}/></button>
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-bold line-clamp-1 mt-1">{item.notes}</p>
                                  <div className="flex items-center justify-between mt-4">
                                     <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-full px-2 py-1 shadow-sm">
                                        <button 
                                          onClick={() => updateQuantity(item.productId, item.quantity - 1)} 
                                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand transition-all"
                                        >
                                          <Minus size={14} />
                                        </button>
                                        <span className="w-4 text-center text-xs font-black text-slate-700">{item.quantity}</span>
                                        <button 
                                          onClick={() => updateQuantity(item.productId, item.quantity + 1)} 
                                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand transition-all"
                                        >
                                          <Plus size={14} />
                                        </button>
                                     </div>
                                     <span className="font-black text-xs text-brand">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                                  </div>
                               </div>
                            </div>
                          ))}
                       </div>

                       <div className="bg-slate-900 p-8 space-y-6">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 text-center">Para continuar, identifique-se</p>
                          <div className="relative">
                             <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                             <input 
                                placeholder="WHATSAPP (COM DDD)" 
                                className="w-full bg-white/5 border border-white/10 p-5 pl-14 text-xs font-black text-white uppercase tracking-widest focus:border-brand transition-all italic-none"
                                value={phoneInput}
                                onChange={e => setPhoneInput(e.target.value)}
                             />
                          </div>
                          <button 
                            onClick={handleIdentify}
                            disabled={formLoading}
                            className="w-full bg-brand py-6 text-xs font-black uppercase tracking-[0.2em] text-white flex items-center justify-center gap-3 hover:brightness-110 transition-all"
                          >
                             {formLoading ? <Loader2 className="animate-spin" /> : "Prosseguir para Checkout"}
                          </button>
                       </div>
                    </div>
                 )}

                 {checkoutStep === "register" && (
                    <div className="space-y-6">
                       <div className="p-6 bg-slate-50 border border-slate-100 space-y-4">
                          <div className="flex items-center gap-3 text-brand"><User size={18} /><p className="text-[10px] font-black uppercase tracking-widest">Informações Pessoais</p></div>
                          <input placeholder="SEU NOME COMPLETO *" className="input-sharp" value={registerForm.name} onChange={e => setRegisterForm({...registerForm, name: e.target.value.toUpperCase()})} />
                          <div className="p-3 bg-white text-[10px] font-black text-slate-400 border border-slate-50 uppercase tracking-widest">WhatsApp: {phoneInput}</div>
                       </div>

                       <div className="p-6 bg-slate-50 border border-slate-100 space-y-4">
                          <div className="flex items-center gap-3 text-brand"><MapPin size={18} /><p className="text-[10px] font-black uppercase tracking-widest">Endereço de Entrega</p></div>
                          <div className="grid grid-cols-3 gap-2">
                             <input placeholder="RUA *" className="input-sharp col-span-2" value={registerForm.street} onChange={e => setRegisterForm({...registerForm, street: e.target.value.toUpperCase()})} />
                             <input placeholder="Nº *" className="input-sharp" value={registerForm.number} onChange={e => setRegisterForm({...registerForm, number: e.target.value.toUpperCase()})} />
                          </div>
                          <input placeholder="COMPLEMENTO (APTO, BLOCO)" className="input-sharp" value={registerForm.complement} onChange={e => setRegisterForm({...registerForm, complement: e.target.value.toUpperCase()})} />
                          <input placeholder="PONTO DE REFERÊNCIA" className="input-sharp" value={registerForm.reference} onChange={e => setRegisterForm({...registerForm, reference: e.target.value.toUpperCase()})} />
                       </div>

                       <button 
                          onClick={handleRegister}
                          disabled={formLoading}
                          className="w-full bg-slate-900 text-white py-6 text-xs font-black uppercase tracking-widest hover:bg-brand transition-all flex items-center justify-center gap-4"
                       >
                          {formLoading ? <Loader2 className="animate-spin" /> : "Salvar e Continuar"}
                       </button>
                    </div>
                 )}

                 {checkoutStep === "payment" && (
                    <div className="space-y-8 pb-10">
                       {/* Endereço Selecionado */}
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Opção de Recebimento</p>
                          <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => setDeliveryType("DELIVERY")} className={`py-3 text-[9px] font-black uppercase border flex items-center justify-center gap-2 transition-all rounded-lg ${deliveryType === "DELIVERY" ? "border-brand bg-brand/5 text-slate-900" : "border-slate-100 text-slate-400"}`}><Bike size={12}/> Entrega</button>
                             <button onClick={() => setDeliveryType("PICKUP")} className={`py-3 text-[9px] font-black uppercase border flex items-center justify-center gap-2 transition-all rounded-lg ${deliveryType === "PICKUP" ? "border-brand bg-brand/5 text-slate-900" : "border-slate-100 text-slate-400"}`}><Package size={12}/> Retirada</button>
                          </div>

                          {deliveryType === "DELIVERY" && (
                             <div className="space-y-3">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                   <div className="flex justify-between items-start">
                                      <div>
                                         <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-1">Entregar em:</p>
                                         <p className="text-[11px] font-black text-slate-900 uppercase">{registerForm.street}, {registerForm.number}</p>
                                         <p className="text-[9px] font-bold text-slate-400 mt-0.5">{registerForm.complement} {registerForm.reference}</p>
                                      </div>
                                      <button onClick={() => setCheckoutStep("register")} className="text-[8px] font-black uppercase text-brand border-b border-brand">Alterar</button>
                                   </div>
                                </div>

                                <div className="space-y-2">
                                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Selecione seu Bairro *</p>
                                   <select 
                                      className="w-full bg-slate-50 border border-slate-100 p-4 text-[11px] font-black uppercase tracking-widest focus:border-brand outline-none rounded-lg"
                                      onChange={e => setSelectedArea(store?.deliveryarea.find((a: any) => a.id === e.target.value) || null)}
                                      value={selectedArea?.id || ""}
                                    >
                                      <option value="">Escolha aqui...</option>
                                      {store?.deliveryarea.map((area: any) => (
                                         <option key={area.id} value={area.id}>{area.neighborhood} - R$ {area.fee.toFixed(2).replace('.', ',')}</option>
                                      ))}
                                   </select>
                                </div>
                             </div>
                          )}
                       </div>

                       {/* Forma de Pagamento */}
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pagar com:</p>
                          <div className="grid grid-cols-3 gap-2">
                             {["pix", "cartão", "dinheiro"].map(method => (
                                <button 
                                  key={method}
                                  onClick={() => setPaymentMethod(method)}
                                  className={`flex flex-col items-center justify-center gap-3 p-4 border rounded-lg uppercase text-[9px] font-black transition-all ${paymentMethod === method ? "border-slate-900 bg-slate-900 text-white shadow-lg" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300"}`}
                                >
                                   <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
                                      {method === 'pix' ? <Navigation size={14}/> : method === 'cartão' ? <CreditCard size={14}/> : <Banknote size={14}/>}
                                   </div>
                                   {method}
                                </button>
                             ))}
                          </div>

                          {paymentMethod === "dinheiro" && (
                             <div className="p-6 bg-orange-50 border border-orange-100 animate-in slide-in-from-top duration-300">
                                <p className="text-[10px] font-black uppercase text-orange-800 mb-3 tracking-widest">Troco para quanto?</p>
                                <div className="relative">
                                   <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-orange-900 text-sm">R$</span>
                                   <input 
                                      placeholder="EX: 100" 
                                      type="number"
                                      value={changeAmount}
                                      onChange={e => setChangeAmount(e.target.value)}
                                      className="w-full bg-white border-2 border-orange-200 p-4 pl-12 text-sm font-black text-orange-900 focus:outline-none"
                                   />
                                </div>
                                {changeAmount && (
                                   <p className="text-[11px] font-bold text-orange-700 mt-4">Calculo do troco: <span className="font-black underline">R$ {(parseFloat(changeAmount) - total).toFixed(2).replace('.', ',')}</span></p>
                                )}
                             </div>
                          )}
                       </div>

                       {/* Observações */}
                       <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Observações Finais</p>
                          <textarea 
                             className="w-full bg-slate-50 border border-slate-100 p-5 text-xs font-bold uppercase min-h-[100px] focus:outline-none focus:border-brand italic-none"
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
                            disabled={formLoading}
                            className="w-full bg-slate-900 text-white py-8 rounded-none text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-brand transition-all shadow-2xl active:scale-[0.98]"
                          >
                             {formLoading ? <Loader2 className="animate-spin" /> : "Concluir e Enviar"}
                             {!formLoading && <ChevronRight size={20}/>}
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
                          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Pedido Realizado!</h2>
                          <p className="text-slate-400 font-medium text-sm mt-4">Seu pedido já está no sistema da nossa loja e estamos preparando tudo com carinho.</p>
                       </div>
                       
                       <p className="p-4 bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Se o seu WhatsApp não abriu automaticamente, clique no botão abaixo para nos enviar o comprovante e agilizar sua entrega.</p>
                       
                       <button 
                          onClick={() => window.open(`https://wa.me/${store?.whatsapp}?text=${generateWhatsAppMessage(0)}`, "_blank")}
                          className="w-full py-5 bg-navy text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all flex items-center justify-center gap-3"
                       >
                          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.011 2.25c-5.385 0-9.75 4.365-9.75 9.75 0 1.716.444 3.328 1.218 4.732L2.25 21.75l5.143-1.348A9.702 9.702 0 0012.011 21.75c5.385 0 9.75-4.365 9.75-9.75S17.396 2.25 12.011 2.25zm0 1.5c4.558 0 8.25 3.692 8.25 8.25s-3.692 8.25-8.25 8.25c-1.579 0-3.056-.444-4.316-1.214l-.309-.188-3.045.797.81-2.934-.206-.339A8.214 8.214 0 013.761 12c0-4.558 3.692-8.25 8.25-8.25z"/></svg>
                          Reenviar via WhatsApp
                       </button>

                       <button 
                         onClick={() => window.location.reload()}
                         className="text-xs font-black uppercase text-brand border-b border-brand tracking-widest"
                       >
                          Fazer outro pedido
                       </button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Global CSS Refined */}
      <style jsx>{`
        .input-sharp {
           width: 100%;
           background-color: white;
           border: 1px solid #e2e8f0;
           padding: 0.85rem 1rem;
           font-size: 11px;
           font-weight: 700;
           text-transform: uppercase;
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
