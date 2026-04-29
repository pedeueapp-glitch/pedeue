"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Heart, 
  ChevronRight, 
  ChevronLeft,
  Search, 
  Package, 
  Clock, 
  X, 
  Phone,
  Maximize2,
  ClipboardList,
  Sparkles,
  Star,
  Info,
  Calendar
} from "lucide-react";
import toast from "react-hot-toast";

interface Variant {
  id: string;
  color: string;
  colorHex: string;
  sizes: string[];
  imageUrl?: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  imageUrl?: string;
  isActive: boolean;
  categoryId: string;
  variants?: Variant[];
}

interface StoreData {
  name: string;
  logo?: string;
  coverImage?: string;
  primaryColor?: string;
  whatsapp?: string;
  description?: string;
  openingHours?: string;
  banners?: string[];
}

interface ServicePageProps {
  store: StoreData;
  products: Product[];
  categories: any[];
}

export default function ServiceCatalog({ store, products, categories }: ServicePageProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showHours, setShowHours] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const primaryColor = store.primaryColor || "#575799";
  const banners = (store.banners || []).filter(url => url && typeof url === 'string');

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    if (selectedProduct || showHours || zoomImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedProduct, showHours, zoomImage]);

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === "all" || p.categoryId === activeCategory;
    return matchSearch && matchCategory && p.isActive;
  });

  const parsedHours = (() => {
    if (!store.openingHours) return [];
    try {
      const h = typeof store.openingHours === 'string' ? JSON.parse(store.openingHours) : store.openingHours;
      return Array.isArray(h) ? h : [];
    } catch { return []; }
  })();

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setSelectedVariant(product.variants?.[0] || null);
    setSelectedSize("");
    setCurrentImageIndex(0);
  }

  const productImages = selectedProduct ? [
    selectedProduct.imageUrl,
    ...(selectedProduct.variants?.map(v => v.imageUrl).filter(Boolean) || [])
  ].filter(Boolean) as string[] : [];

  function toggleWishlist(productId: string) {
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
    if (!wishlist.includes(productId)) {
        toast.success("Favoritado!");
    }
  }

  function sendToWhatsApp() {
    if (!selectedProduct) return;

    const storeUrl = typeof window !== 'undefined' ? window.location.href : '';
    
    const message = `✨ *SOLICITAÇÃO DE ORÇAMENTO* ✨\n\n` +
      `Olá! Tenho interesse no seguinte serviço:\n\n` +
      `🛠️ *Serviço:* ${selectedProduct.name}\n` +
      (selectedVariant ? `📌 *Opção:* ${selectedVariant.color}\n` : "") +
      (selectedSize ? `📝 *Detalhe:* ${selectedSize}\n` : "") +
      `💰 *Valor Base:* R$ ${(selectedProduct.salePrice || selectedProduct.price).toFixed(2).replace('.', ',')}\n\n` +
      `🔗 *Link:* ${storeUrl}\n\n` +
      `Gostaria de agendar ou tirar algumas dúvidas sobre este serviço. Pode me ajudar? 😊`;

    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${store.whatsapp}?text=${encodedMsg}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
       <style dangerouslySetInnerHTML={{
        __html: `
        .bg-brand { background-color: ${primaryColor} !important; }
        .text-brand { color: ${primaryColor} !important; }
        .border-brand { border-color: ${primaryColor} !important; }
      ` }} />

      {/* HEADER ESTILO CARDAPIO */}
      <div className="relative">
        <div className="h-48 md:h-64 bg-slate-200 relative overflow-hidden">
          {store.coverImage ? (
            <img src={store.coverImage} className="w-full h-full object-cover" alt="banner" />
          ) : (
            <div className="w-full h-full bg-brand opacity-80" />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border-b-8 border-brand">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-20 h-20 md:w-32 md:h-32 bg-white border-4 border-white -mt-16 md:-mt-20 shadow-xl overflow-hidden flex-shrink-0 rounded-[2rem] relative z-20">
                {store.logo ? (
                  <img src={store.logo} className="w-full h-full object-cover" alt="logo" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200"><ClipboardList size={48} /></div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">{store.name}</h1>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-2xl">{store.description || "Profissionalismo e qualidade em cada detalhe."}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6">
                   <button onClick={() => setShowHours(true)} className="flex items-center gap-2 hover:opacity-80 transition-all group">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-brand transition-colors"><Calendar size={18} /></div>
                      <div className="text-left">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibilidade</p>
                         <p className="text-xs font-bold text-slate-700">Ver Agenda</p>
                      </div>
                   </button>
                   <a href={`https://wa.me/${store.whatsapp}`} target="_blank" className="flex items-center gap-2 hover:opacity-80 transition-all group">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-green-500 transition-colors"><Phone size={18} /></div>
                      <div className="text-left">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</p>
                         <p className="text-xs font-bold text-slate-700">Solicitar Orçamento</p>
                      </div>
                   </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="max-w-5xl mx-auto px-4 mt-10 space-y-6 sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md pb-6 pt-2">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-300 group-focus-within:text-brand transition-colors" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Qual serviço você procura?"
            className="block w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-base font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all shadow-sm"
          />
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex items-center gap-2 px-8 py-3.5 text-xs font-black transition-all rounded-2xl whitespace-nowrap border-2 ${activeCategory === "all"
              ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105"
              : "bg-white border-white text-slate-400 hover:border-slate-100"
              }`}
          >
            Tudo
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-8 py-3.5 text-xs font-black transition-all rounded-2xl whitespace-nowrap border-2 ${activeCategory === cat.id
                ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105"
                : "bg-white border-white text-slate-400 hover:border-slate-100"
                }`}
            >
              {cat.emoji && <span className="text-lg">{cat.emoji}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE SERVIÇOS PREMIUM */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {filteredProducts.map(product => {
            const firstVariant = product.variants?.[0];
            const isFavorite = wishlist.includes(product.id);
            return (
              <div 
                key={product.id} 
                className="group cursor-pointer flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-brand/20" 
                onClick={() => openProduct(product)}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  {(firstVariant?.imageUrl || product.imageUrl) ? (
                    <img src={firstVariant?.imageUrl || product.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={product.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200"><Package size={40} /></div>
                  )}
                  
                  <button 
                    onClick={e => { e.stopPropagation(); toggleWishlist(product.id); }}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
                  >
                    <Heart size={18} className={isFavorite ? "fill-red-500 text-red-500" : "text-slate-300"} />
                  </button>

                  <div className="absolute bottom-4 left-4 bg-brand text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 uppercase tracking-widest">
                    <Sparkles size={12} /> Serviço
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-sm font-black text-slate-800 line-clamp-1 mb-2 group-hover:text-brand transition-colors">{product.name}</h3>
                  <div className="flex flex-col">
                    {product.salePrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] text-slate-300 line-through font-bold">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                        <span className="text-lg font-black text-brand tracking-tighter">R$ {product.salePrice.toFixed(2).replace('.', ',')}</span>
                      </div>
                    ) : (
                      <span className="text-lg font-black text-slate-900 tracking-tighter">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-32 text-center flex flex-col items-center gap-4 opacity-20">
            <ClipboardList size={80} className="text-slate-300" />
            <p className="text-sm font-black uppercase tracking-[0.3em]">Nenhum serviço encontrado</p>
          </div>
        )}
      </div>

      <footer className="py-20 text-center opacity-20">
        <div className="flex items-center justify-center gap-2 mb-2">
           <div className="h-[1px] w-12 bg-slate-400"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em]">PedeUe Services</p>
           <div className="h-[1px] w-12 bg-slate-400"></div>
        </div>
      </footer>

      {/* MODAL FULLSCREEN PREMIUM */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom duration-500">
          <div className="relative flex-1 flex flex-col overflow-hidden">
            <button
               onClick={() => setSelectedProduct(null)}
               className="fixed top-8 right-8 z-[110] bg-slate-900/5 backdrop-blur-xl p-4 rounded-[2rem] hover:bg-slate-900/10 transition-all group shadow-xl"
            >
               <X size={28} className="text-slate-900 group-hover:scale-90 transition-transform" />
            </button>

            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
              {/* GALERIA */}
              <div className="w-full lg:w-[55%] h-[60vh] lg:h-full bg-slate-50 relative flex-shrink-0">
                <img
                  src={productImages[currentImageIndex]}
                  className="w-full h-full object-cover cursor-zoom-in"
                  alt={selectedProduct.name}
                  onClick={() => setZoomImage(productImages[currentImageIndex])}
                />
                
                {productImages.length > 1 && (
                  <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3 px-6 overflow-x-auto no-scrollbar pb-4">
                    {productImages.map((img, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-16 h-16 rounded-2xl border-4 overflow-hidden flex-shrink-0 transition-all shadow-xl ${idx === currentImageIndex ? 'border-brand scale-110' : 'border-white/50 opacity-60'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-6 pointer-events-none">
                   <button 
                     onClick={() => setCurrentImageIndex(prev => (prev - 1 + productImages.length) % productImages.length)}
                     className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl pointer-events-auto hover:bg-white transition-all"
                   >
                      <ChevronLeft size={24} className="text-slate-600" />
                   </button>
                   <button 
                     onClick={() => setCurrentImageIndex(prev => (prev + 1) % productImages.length)}
                     className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl pointer-events-auto hover:bg-white transition-all"
                   >
                      <ChevronRight size={24} className="text-slate-600" />
                   </button>
                </div>
              </div>

              {/* CONTEÚDO */}
              <div className="flex-1 p-8 lg:p-16 flex flex-col bg-white">
                <div className="mb-10">
                   <div className="flex items-center gap-3 mb-4">
                      <span className="bg-slate-100 text-[10px] font-black text-slate-500 px-3 py-1 rounded-lg uppercase tracking-widest">
                         {categories.find(c => c.id === selectedProduct.categoryId)?.name || "Serviço Profissional"}
                      </span>
                   </div>
                   <h2 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6">
                      {selectedProduct.name}
                   </h2>
                   <div className="flex items-center gap-4">
                      {selectedProduct.salePrice ? (
                        <>
                           <span className="text-xl text-slate-300 line-through font-black">R$ {selectedProduct.price.toFixed(2).replace('.', ',')}</span>
                           <p className="text-4xl font-black text-brand tracking-tighter">R$ {selectedProduct.salePrice.toFixed(2).replace('.', ',')}</p>
                        </>
                      ) : (
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">R$ {selectedProduct.price.toFixed(2).replace('.', ',')}</p>
                      )}
                   </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-8 mb-10 border border-slate-100">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={14} /> Detalhes do Serviço</h4>
                   <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                      {selectedProduct.description || "Nenhum detalhe adicional fornecido para este serviço exclusivo."}
                   </p>
                </div>

                {/* OPÇÕES */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-10 mb-12">
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Escolha uma Opção</p>
                       <div className="flex flex-wrap gap-4">
                         {selectedProduct.variants.map(v => (
                           <button
                             key={v.id}
                             onClick={() => { 
                               setSelectedVariant(v); 
                               setSelectedSize(""); 
                               const idx = productImages.indexOf(v.imageUrl || "");
                               if (idx !== -1) setCurrentImageIndex(idx);
                             }}
                             className={`group relative w-12 h-12 rounded-2xl border-4 transition-all ${selectedVariant?.id === v.id ? 'border-brand scale-110 shadow-2xl' : 'border-slate-50 hover:border-slate-200'}`}
                           >
                              <div className="w-full h-full rounded-xl" style={{ backgroundColor: v.colorHex }} />
                              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">{v.color}</span>
                           </button>
                         ))}
                       </div>
                     </div>

                     {selectedVariant && selectedVariant.sizes.length > 0 && (
                       <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Especificação: <span className="text-brand">{selectedSize || "—"}</span></p>
                         <div className="flex flex-wrap gap-3">
                           {selectedVariant.sizes.map(size => (
                             <button
                               key={size}
                               onClick={() => setSelectedSize(size)}
                               className={`px-8 py-4 text-[10px] font-black transition-all rounded-2xl border-2 ${selectedSize === size ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                             >
                               {size}
                             </button>
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
                )}

                <button
                  onClick={sendToWhatsApp}
                  disabled={!selectedSize && (selectedVariant?.sizes?.length || 0) > 0}
                  className="w-full py-6 bg-brand text-white font-black tracking-[0.2em] text-xs transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 rounded-3xl shadow-2xl shadow-brand/30 mt-auto flex items-center justify-center gap-3"
                >
                  <Phone size={18} />
                  SOLICITAR ORÇAMENTO NO WHATSAPP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ZOOM MODAL */}
      {zoomImage && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 flex items-center justify-center p-6 animate-in fade-in duration-500" onClick={() => setZoomImage(null)}>
           <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-all">
              <X size={40} />
           </button>
           <img src={zoomImage} className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" alt="Zoom" />
        </div>
      )}

      {/* MODAL HORÁRIOS */}
      {showHours && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowHours(false)}>
           <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl border-8 border-white animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-10">
                 <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-brand mx-auto mb-6 shadow-sm"><Clock size={32} /></div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Horário de Atendimento</h2>
                 <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">Confira nossa disponibilidade</p>
              </div>
              <div className="space-y-3">
                 {parsedHours.length > 0 ? (
                    parsedHours.map((h: any) => (
                        <div key={h.day} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{h.day}</span>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-lg ${h.enabled ? 'bg-brand/10 text-brand' : 'bg-red-50 text-red-400 opacity-50'}`}>
                              {h.enabled ? `${h.open} - ${h.close}` : 'FECHADO'}
                          </span>
                        </div>
                    ))
                 ) : (
                    <p className="text-slate-300 text-[10px] font-black text-center py-10 uppercase tracking-widest">Não configurado</p>
                 )}
              </div>
              <button 
                onClick={() => setShowHours(false)}
                className="w-full mt-10 py-5 bg-slate-900 text-white text-[10px] font-black tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-xl shadow-slate-900/20 uppercase"
              >
                 Voltar ao Catálogo
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
