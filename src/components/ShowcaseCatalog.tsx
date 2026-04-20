"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Heart, ChevronRight, ArrowLeft, Search, Package } from "lucide-react";

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
}

interface ShowcasePageProps {
  store: StoreData;
  products: Product[];
  categories: any[];
}

export default function ShowcaseCatalog({ store, products, categories }: ShowcasePageProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  const primaryColor = store.primaryColor || "#0f172a";

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === "all" || p.categoryId === activeCategory;
    return matchSearch && matchCategory && p.isActive;
  });

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setSelectedVariant(product.variants?.[0] || null);
    setSelectedSize("");
  }

  function toggleWishlist(productId: string) {
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  }

  function addToCart() {
    if (!selectedProduct || !selectedSize) return;
    const item = {
      product: selectedProduct,
      variant: selectedVariant,
      size: selectedSize,
      qty: 1
    };
    setCart(prev => [...prev, item]);
    sendToWhatsApp(item);
  }

  function sendToWhatsApp(item: any) {
    const msg = encodeURIComponent(
      `Olá! Quero encomendar:\n\n` +
      `*${item.product.name}*\n` +
      `Cor: ${item.variant?.color || 'Padrão'}\n` +
      `Tamanho: ${item.size}\n` +
      `Preço: R$ ${item.product.price.toFixed(2)}\n\n` +
      `Aguardo seu retorno!`
    );
    window.open(`https://wa.me/${store.whatsapp}?text=${msg}`, '_blank');
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* HERO BANNER */}
      <div className="relative h-[280px] md:h-[420px] overflow-hidden bg-slate-900">
        {store.coverImage && (
          <img src={store.coverImage} className="w-full h-full object-cover opacity-60" alt={store.name} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* HEADER DA VITRINE */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-6">
          {store.logo ? (
            <img src={store.logo} className="h-12 w-12 object-contain rounded-none" alt={store.name} />
          ) : (
            <div className="h-12 w-12 bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-black text-xl">
              {store.name.charAt(0)}
            </div>
          )}
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <div className="relative">
                <ShoppingBag className="text-white" size={24} />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ backgroundColor: primaryColor }}>
                  {cart.length}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nome e Busca */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          <h1 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">
            {store.name}
          </h1>
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={16} />
            <input
              type="text"
              placeholder="Buscar produto..."
              className="w-full bg-white/15 backdrop-blur-md border border-white/20 text-white placeholder-white/50 pl-11 pr-4 py-3 text-sm font-medium outline-none focus:bg-white/25 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* FILTRO DE CATEGORIAS */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 overflow-x-auto scrollbar-hidden">
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex-shrink-0 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === "all" ? "text-white border-transparent" : "border-slate-200 text-slate-500 hover:border-slate-400"}`}
            style={activeCategory === "all" ? { backgroundColor: primaryColor } : {}}
          >
            Tudo
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === cat.id ? "text-white border-transparent" : "border-slate-200 text-slate-500 hover:border-slate-400"}`}
              style={activeCategory === cat.id ? { backgroundColor: primaryColor } : {}}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE PRODUTOS */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 text-slate-300">
            <Package size={48} className="mx-auto mb-4" />
            <p className="font-black uppercase tracking-widest text-sm">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map(product => {
              const firstVariant = product.variants?.[0];
              const inWishlist = wishlist.includes(product.id);
              return (
                <div key={product.id} className="group cursor-pointer" onClick={() => openProduct(product)}>
                  {/* Imagem */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 mb-3">
                    <img
                      src={firstVariant?.imageUrl || product.imageUrl || ""}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt={product.name}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {!firstVariant?.imageUrl && !product.imageUrl && (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                        <Package size={40} />
                      </div>
                    )}

                    {/* Botão de favorito */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleWishlist(product.id); }}
                      className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-all hover:scale-110"
                    >
                      <Heart
                        size={16}
                        className={inWishlist ? "fill-red-500 text-red-500" : "text-slate-400"}
                      />
                    </button>

                    {/* Paleta de cores (preview) */}
                    {product.variants && product.variants.length > 1 && (
                      <div className="absolute bottom-3 left-3 flex gap-1">
                        {product.variants.slice(0, 4).map(v => (
                          <div
                            key={v.id}
                            className="w-4 h-4 border border-white shadow-sm"
                            style={{ backgroundColor: v.colorHex }}
                            title={v.color}
                          />
                        ))}
                        {product.variants.length > 4 && (
                          <div className="w-4 h-4 bg-white/80 text-[7px] font-black text-slate-500 flex items-center justify-center">
                            +{product.variants.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Remove stock badge */}
                    {product.variants?.every(v => v.stock === 0) && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-300 px-3 py-1">Esgotado</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                      {categories.find(c => c.id === product.categoryId)?.name || ""}
                    </p>
                    <h3 className="font-black text-slate-900 text-sm leading-tight line-clamp-2 mb-1 uppercase tracking-tight">
                      {product.name}
                    </h3>
                    <p className="font-black text-slate-900 text-base" style={{ color: primaryColor }}>
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DETALHE DO PRODUTO */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6">
          <div className="bg-white w-full md:max-w-4xl md:max-h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 md:animate-in md:zoom-in-95">

            {/* Imagem Principal */}
            <div className="relative md:w-1/2 aspect-square md:aspect-auto bg-slate-100 flex-shrink-0">
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-2 shadow-sm hover:bg-white transition-all"
              >
                <ArrowLeft size={20} className="text-slate-700" />
              </button>

              <img
                src={selectedVariant?.imageUrl || selectedProduct.imageUrl || ""}
                className="w-full h-full object-cover"
                alt={selectedProduct.name}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            {/* Informações */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {categories.find(c => c.id === selectedProduct.categoryId)?.name}
              </p>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-2">
                {selectedProduct.name}
              </h2>
              {selectedProduct.description && (
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">{selectedProduct.description}</p>
              )}
              <p className="text-3xl font-black mb-8" style={{ color: primaryColor }}>
                R$ {selectedProduct.price.toFixed(2).replace('.', ',')}
              </p>

              {/* Seleção de Cor */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Cor: <span className="text-slate-800">{selectedVariant?.color || ""}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => { setSelectedVariant(v); setSelectedSize(""); }}
                        title={v.color}
                        className={`w-10 h-10 transition-all ${selectedVariant?.id === v.id ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: v.colorHex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Seleção de Tamanho */}
              {selectedVariant && selectedVariant.sizes.length > 0 && (
                <div className="mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Tamanho: <span className="text-slate-800">{selectedSize || "Selecione"}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedVariant.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[3rem] h-12 px-3 text-[10px] font-black uppercase border-2 transition-all ${selectedSize === size ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto space-y-3">
                <button
                  onClick={addToCart}
                  disabled={!selectedSize && (selectedVariant?.sizes?.length || 0) > 0}
                  className="w-full py-5 text-white font-black uppercase tracking-widest text-sm transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ShoppingBag size={20} />
                  {!selectedSize && (selectedVariant?.sizes?.length || 0) > 0 ? "Selecione um tamanho" : "Pedir via WhatsApp"}
                </button>
                <button
                  onClick={() => toggleWishlist(selectedProduct.id)}
                  className="w-full py-4 border-2 border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:border-red-300 hover:text-red-400 transition-all flex items-center justify-center gap-2"
                >
                  <Heart size={16} className={wishlist.includes(selectedProduct.id) ? "fill-red-400 text-red-400" : ""} />
                  {wishlist.includes(selectedProduct.id) ? "Nos favoritos" : "Adicionar aos favoritos"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
