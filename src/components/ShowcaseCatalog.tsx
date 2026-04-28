"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ShoppingBag, 
  Heart, 
  ChevronRight, 
  ChevronLeft,
  ArrowLeft, 
  Search, 
  Package, 
  Clock, 
  X, 
  Camera, 
  Phone,
  Maximize2
} from "lucide-react";

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

interface ShowcasePageProps {
  store: StoreData;
  products: Product[];
  categories: any[];
}

export default function ShowcaseCatalog({ store, products, categories }: ShowcasePageProps) {
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

  // Auto-slide para o carrossel promocional
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Prevent body scroll when modal is open
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
  }

  function sendToWhatsApp() {
    if (!selectedProduct) return;
    const msg = encodeURIComponent(
      `Olá! Tenho interesse neste item da vitrine:\n\n` +
      `*${selectedProduct.name}*\n` +
      (selectedVariant ? `Variação: ${selectedVariant.color}\n` : "") +
      (selectedSize ? `Tamanho: ${selectedSize}\n` : "") +
      `Preço: R$ ${(selectedProduct.salePrice || selectedProduct.price).toFixed(2)}\n\n` +
      `Pode me confirmar se ainda tem?`
    );
    window.open(`https://wa.me/${store.whatsapp}?text=${msg}`, '_blank');
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${primaryColor}05` }}>
      
      {/* 1. SEÇÃO FIXA: CAPA TOP */}
      <div className="relative h-[25vh] md:h-[30vh] bg-slate-100 group overflow-hidden">
         <div className="absolute top-4 left-4 z-30">
            <a 
              href={`https://wa.me/${store.whatsapp}`} 
              target="_blank"
              className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-md shadow-sm border border-slate-50 hover:translate-y-[-2px] transition-all text-slate-600 flex items-center gap-2"
            >
               <Phone size={13} className="text-green-400" />
               <span className="text-[10px] font-medium tracking-widest">Contato</span>
            </a>
         </div>

         <div className="absolute top-4 right-4 z-30">
            <button 
              onClick={() => setShowHours(true)}
              className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-md shadow-sm border border-slate-50 hover:translate-y-[-2px] transition-all text-slate-600 flex items-center gap-2"
            >
               <Clock size={13} className="text-slate-400" />
               <span className="text-[10px] font-medium tracking-widest">Horários</span>
            </button>
         </div>

         {store.coverImage ? (
            <img src={store.coverImage} className="w-full h-full object-cover" alt="Capa" />
         ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
               <Package size={40} className="text-slate-200" />
            </div>
         )}
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20" />
      </div>

      {/* 2. OVERLAP: LOGO CENTRALIZADA (MENOS ARREDONDADA) */}
      <div className="max-w-4xl mx-auto px-4 relative z-30">
         <div className="flex flex-col items-center -mt-12 md:-mt-16">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white p-1 shadow-lg rounded-lg border-2 border-white flex-shrink-0">
               {store.logo ? (
                 <img src={store.logo} className="w-full h-full object-cover rounded-md" alt="Logo" />
               ) : (
                 <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                    <ShoppingBag size={40} />
                 </div>
               )}
            </div>
            
            <div className="mt-4 text-center">
               <h1 className="text-2xl md:text-3xl font-medium text-slate-800 tracking-tight mb-1">{store.name}</h1>
               <p className="text-slate-400 text-[11px] font-light tracking-[0.15em] max-w-sm mx-auto">
                  {store.description || "Produtos feitos com amor"}
               </p>
            </div>
         </div>
      </div>


      {/* 4. BUSCA E CATEGORIAS (ELEGANTE & STICKY) */}
      <div className="max-w-4xl mx-auto px-4 mt-8 sticky top-0 z-40 bg-white/5 backdrop-blur-lg pb-4 pt-2 -mx-4 px-4">
         <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-white shadow-sm flex flex-col md:flex-row items-center gap-2">
            <div className="relative w-full md:w-64">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input 
                  type="text"
                  placeholder="O que você procura?"
                  className="w-full bg-slate-50/50 border-none pl-11 pr-4 py-3 text-base md:text-[10px] font-black tracking-widest focus:ring-2 focus:ring-purple-500/10 rounded-xl outline-none text-slate-600 placeholder:text-slate-300"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
               />
            </div>

            <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar w-full p-1">
               <button 
                  onClick={() => setActiveCategory("all")}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap shadow-sm border-2 ${activeCategory === "all" ? 'text-white border-transparent' : 'text-slate-400 border-white bg-white hover:border-slate-100'}`}
                  style={activeCategory === "all" ? { backgroundColor: primaryColor } : {}}
               >
                  Tudo
               </button>
               {categories.map(cat => (
                 <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap shadow-sm border-2 ${activeCategory === cat.id ? 'text-white border-transparent' : 'text-slate-400 border-white bg-white hover:border-slate-100'}`}
                    style={activeCategory === cat.id ? { backgroundColor: primaryColor } : {}}
                 >
                    {cat.emoji && <span className="mr-2 text-sm">{cat.emoji}</span>}
                    {cat.name}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* 5. GRID DE PRODUTOS (MENOS ARREDONDADO) */}
      <div className="max-w-6xl mx-auto px-4 py-12">
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map(product => {
               const firstVariant = product.variants?.[0];
               const isFavorite = wishlist.includes(product.id);
               return (
                 <div 
                   key={product.id} 
                   className="group cursor-pointer flex flex-col transition-all hover:translate-y-[-4px]" 
                   onClick={() => openProduct(product)}
                 >
                    <div className="relative aspect-[4/5] bg-white overflow-hidden rounded-md mb-4 shadow-sm group-hover:shadow-md transition-all border border-slate-100/50">
                       {(firstVariant?.imageUrl || product.imageUrl) ? (
                          <img src={firstVariant?.imageUrl || product.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={product.name} />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-100"><Package size={24} /></div>
                       )}
                       <button 
                         onClick={e => { e.stopPropagation(); toggleWishlist(product.id); }}
                         className="absolute top-3 right-3 w-8 h-8 bg-white/70 backdrop-blur-sm rounded-md shadow-sm flex items-center justify-center transition-all hover:bg-white z-10"
                       >
                          <Heart size={13} className={isFavorite ? "fill-red-400 text-red-400" : "text-slate-300"} />
                       </button>

                       {product.salePrice && (
                         <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[8px] font-bold px-2 py-1 rounded-sm tracking-tighter" style={{ color: primaryColor }}>
                           Oferta
                         </div>
                       )}
                    </div>
                    <div className="px-1 text-center md:text-left flex flex-col">
                       <h3 className="text-[11px] font-medium text-slate-700 tracking-tight line-clamp-1 mb-1">{product.name}</h3>
                       <div className="flex items-center justify-center md:justify-start gap-2">
                          {product.salePrice ? (
                             <>
                                <span className="text-[9px] text-slate-300 line-through font-light">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                                <span className="font-semibold text-xs" style={{ color: primaryColor }}>R$ {product.salePrice.toFixed(2).replace('.', ',')}</span>
                             </>
                          ) : (
                             <span className="font-semibold text-xs" style={{ color: primaryColor }}>R$ {product.price.toFixed(2).replace('.', ',')}</span>
                          )}
                       </div>
                    </div>
                 </div>
               );
            })}
         </div>
      </div>

      <footer className="py-16 text-center opacity-30">
         <p className="text-[9px] font-light text-slate-400 tracking-[0.3em]">Exibido por PedeUe</p>
      </footer>

      {/* MODAL DETALHADO (MENOS ARREDONDADO + ZOOM) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
          <div className="relative flex-1 flex flex-col overflow-hidden">
            <button
               onClick={() => setSelectedProduct(null)}
               className="fixed top-6 right-6 z-[110] bg-slate-900/10 backdrop-blur-md p-3 rounded-full hover:bg-slate-900/20 transition-all"
            >
               <X size={24} className="text-slate-900" />
            </button>

            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              {/* Imagem Proporção Fixa */}
              <div className="w-full md:w-[45%] h-48 md:h-full flex-shrink-0 bg-slate-50 relative group/zoom sticky top-0 md:relative z-10">
                <img
                  src={productImages[currentImageIndex]}
                  className="w-full h-full object-cover cursor-zoom-in"
                  alt={selectedProduct.name}
                  onClick={() => setZoomImage(productImages[currentImageIndex])}
                />
               <div className="absolute bottom-4 right-4 p-2 bg-white/80 rounded-md shadow-sm opacity-0 group-hover/zoom:opacity-100 transition-opacity">
                  <Maximize2 size={16} className="text-slate-400" />
               </div>
               
               {productImages.length > 1 && (
                  <>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev - 1 + productImages.length) % productImages.length); }}
                       className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/70 backdrop-blur-sm rounded-md flex items-center justify-center shadow-sm"
                     >
                        <ChevronLeft size={16} className="text-slate-400" />
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % productImages.length); }}
                       className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/70 backdrop-blur-sm rounded-md flex items-center justify-center shadow-sm"
                     >
                        <ChevronRight size={16} className="text-slate-400" />
                     </button>
                     
                     <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4 overflow-x-auto no-scrollbar">
                        {productImages.map((img, idx) => (
                           <button 
                             key={idx}
                             onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                             className={`w-10 h-10 rounded-md border-2 flex-shrink-0 transition-all ${idx === currentImageIndex ? 'border-white scale-105' : 'border-transparent opacity-50'}`}
                           >
                              <img src={img} className="w-full h-full object-cover rounded-sm" />
                           </button>
                        ))}
                     </div>
                  </>
               )}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 p-6 md:p-10 flex flex-col bg-white">
               <div className="mb-8">
                 <span className="text-[9px] font-medium text-slate-300 tracking-widest mb-2 inline-block">
                    {categories.find(c => c.id === selectedProduct.categoryId)?.name}
                 </span>
                 <h2 className="text-xl md:text-2xl font-medium text-slate-800 tracking-tight leading-tight mb-4">
                    {selectedProduct.name}
                 </h2>
                 <div className="flex items-center gap-3">
                    {selectedProduct.salePrice ? (
                       <>
                          <span className="text-sm text-slate-300 line-through font-light">R$ {selectedProduct.price.toFixed(2).replace('.', ',')}</span>
                          <p className="text-2xl font-semibold" style={{ color: primaryColor }}>R$ {selectedProduct.salePrice.toFixed(2).replace('.', ',')}</p>
                       </>
                    ) : (
                       <p className="text-2xl font-semibold" style={{ color: primaryColor }}>R$ {selectedProduct.price.toFixed(2).replace('.', ',')}</p>
                    )}
                 </div>
               </div>

               <div className="mb-10 text-slate-500 text-[11px] leading-relaxed font-light">
                  {selectedProduct.description || "Nenhum detalhe adicional fornecido."}
               </div>

               {/* Variantes */}
               <div className="space-y-8 mb-10">
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 tracking-widest mb-4">Opções de Estilo</p>
                      <div className="flex flex-wrap gap-3">
                        {selectedProduct.variants.map(v => (
                          <button
                            key={v.id}
                            onClick={() => { 
                              setSelectedVariant(v); 
                              setSelectedSize(""); 
                              const idx = productImages.indexOf(v.imageUrl || "");
                              if (idx !== -1) setCurrentImageIndex(idx);
                            }}
                            className={`w-9 h-9 rounded-md border-2 transition-all p-0.5 ${selectedVariant?.id === v.id ? 'scale-110 shadow-md border-slate-200' : 'border-slate-50'}`}
                          >
                             <div className="w-full h-full rounded-sm" style={{ backgroundColor: v.colorHex }} title={v.color} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVariant && selectedVariant.sizes.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 tracking-widest mb-4">Tamanho: <span className="text-slate-800">{selectedSize || "Selecione"}</span></p>
                      <div className="flex flex-wrap gap-2">
                        {selectedVariant.sizes.map(size => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 text-[10px] font-medium transition-all rounded-md border ${selectedSize === size ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
               </div>

                <button
                  onClick={sendToWhatsApp}
                  disabled={!selectedSize && (selectedVariant?.sizes?.length || 0) > 0}
                  className="w-full py-4 md:py-6 text-white font-black tracking-[0.2em] text-xs transition-all hover:brightness-105 disabled:opacity-30 rounded-xl md:rounded-2xl shadow-xl mt-auto"
                  style={{ backgroundColor: primaryColor }}
                >
                  TENHO INTERESSE NO WHATSAPP
                </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* FULLSCREEN ZOOM */}
      {zoomImage && (
        <div className="fixed inset-0 z-[200] bg-white/95 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setZoomImage(null)}>
           <button className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 p-2 transition-all">
              <X size={28} />
           </button>
           <img src={zoomImage} className="max-w-full max-h-full object-contain" alt="Zoom" />
        </div>
      )}

      {/* MODAL HORÁRIOS */}
      {showHours && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-800/10 backdrop-blur-sm" onClick={() => setShowHours(false)}>
           <div className="bg-white w-full max-w-sm rounded-xl p-10 animate-in slide-in-from-bottom-2 duration-300 shadow-2xl border border-slate-100" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-medium text-slate-800 tracking-tight mb-8 text-center">Horários</h2>
              <div className="space-y-1">
                 {parsedHours.length > 0 ? (
                    parsedHours.map((h: any) => (
                        <div key={h.day} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                          <span className="text-[10px] font-medium text-slate-400 tracking-wider">{h.day}</span>
                          <span className={`text-[10px] font-semibold ${h.enabled ? 'text-slate-600' : 'text-red-200'}`}>
                              {h.enabled ? `${h.open} - ${h.close}` : 'Fechado'}
                          </span>
                        </div>
                    ))
                 ) : (
                    <p className="text-slate-300 text-[10px] font-medium text-center">Indisponível</p>
                 )}
              </div>
              <button 
                onClick={() => setShowHours(false)}
                className="w-full mt-10 py-4 bg-slate-800 text-white text-[10px] font-medium tracking-[0.2em] rounded-md hover:bg-slate-900 transition-all"
              >
                 Fechar
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
