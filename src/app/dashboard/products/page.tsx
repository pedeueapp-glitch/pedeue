"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, Edit3, Trash2, Loader2, X, PlusSquare,
  Package, Camera, AlertCircle, CheckCircle2, PlusCircle, Palette
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { ConfirmModal } from "@/components/ConfirmModal";
import { VariantEditor } from "@/components/VariantEditor";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [storeType, setStoreType] = useState<string>("RESTAURANT");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "", description: "", price: "", categoryId: "",
    imageUrl: "", inStock: true, isActive: true
  });

  const [uploading, setUploading] = useState(false);
  const [optionGroups, setOptionGroups] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [minSelect, setMinSelect] = useState(0);
  const [maxSelect, setMaxSelect] = useState(1);
  const [isMandatory, setIsMandatory] = useState(false);
  const [addingItemToGroup, setAddingItemToGroup] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const isShowcase = storeType === "SHOWCASE";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, storeRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/store")
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      const storeData = await storeRes.json();
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setStoreType(storeData?.storeType || "RESTAURANT");
    } catch { toast.error("Erro ao carregar"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading("Otimizando imagem...");
    try {
      const data = new FormData();
      data.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const result = await res.json();
      if (result.url) {
        setFormData(prev => ({ ...prev, imageUrl: result.url }));
        toast.success("Imagem pronta!", { id: toastId });
      }
    } catch { toast.error("Falha no upload", { id: toastId }); } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct ? "PATCH" : "POST";
    const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      toast.success(isShowcase ? "Produto da Vitrine salvo!" : "Salvo com sucesso!");
      setIsModalOpen(false);
      fetchData();
    } catch { toast.error("Erro ao salvar"); }
  };

  const toggleStatus = async (product: any) => {
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, price: product.price.toString(), isActive: !product.isActive }),
      });
      toast.success("Status atualizado");
      fetchData();
    } catch { toast.error("Erro"); }
  };

  const deleteProduct = async (id: string) => { setProductToDelete(id); setIsDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const toastId = toast.loading("Removendo...");
    try {
      const res = await fetch(`/api/products/${productToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Produto removido", { id: toastId });
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro", { id: toastId });
    }
  };

  const fetchOptions = async (productId: string) => {
    const res = await fetch(`/api/products/options?productId=${productId}`);
    const data = await res.json();
    setOptionGroups(Array.isArray(data) ? data : []);
  };

  const addOptionGroup = async () => {
    if (!newGroupName) return;
    await fetch("/api/products/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: editingProduct.id, name: newGroupName, minChoices: isMandatory ? 1 : 0, maxChoices: maxSelect }),
    });
    setNewGroupName("");
    fetchOptions(editingProduct.id);
  };

  const addOptionItem = async (groupId: string) => {
    if (!newItemName) return;
    await fetch("/api/products/options/item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, name: newItemName, price: parseFloat(newItemPrice || "0") }),
    });
    setNewItemName(""); setNewItemPrice(""); setAddingItemToGroup(null);
    fetchOptions(editingProduct.id);
  };

  const deleteOptionGroup = async (groupId: string) => {
    await fetch(`/api/products/options?id=${groupId}`, { method: "DELETE" });
    fetchOptions(editingProduct.id);
  };

  const deleteOptionItem = async (itemId: string) => {
    await fetch(`/api/products/options/item?id=${itemId}`, { method: "DELETE" });
    fetchOptions(editingProduct.id);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const productsByCategory = categories.map(cat => ({
    ...cat,
    items: filteredProducts.filter(p => p.categoryId === cat.id)
  })).filter(cat => cat.items.length > 0 || searchTerm === "");

  return (
    <>
      <Header title={isShowcase ? "Catálogo da Vitrine" : "Gerenciamento de Cardápio"} />

      {isShowcase && (
        <div className="mx-6 lg:mx-10 mt-6 p-4 bg-orange-50 border border-orange-200 rounded-none flex items-center gap-3">
          <Palette size={18} className="text-orange-500 flex-shrink-0" />
          <p className="text-xs font-bold text-orange-700">
            Modo Vitrine ativo. Gerencie cores, tamanhos e fotos individuais clicando em Variações em cada produto.
          </p>
        </div>
      )}

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isShowcase ? "Produtos da Vitrine" : "Lista de Itens"}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {isShowcase ? "Configure produtos com cores e tamanhos." : "Configure seus produtos e categorias."}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Pesquisar..."
                className="input-field pl-11 !rounded-2xl"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                setEditingProduct(null);
                setFormData({ name: "", description: "", price: "", categoryId: categories[0]?.id || "", imageUrl: "", inStock: true, isActive: true, barcode: "" });
                setIsModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2 !py-3.5 !rounded-2xl"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">{isShowcase ? "Novo Produto" : "Adicionar Produto"}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
            <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">Sincronizando...</span>
          </div>
        ) : (
          <div className="space-y-12">
            {productsByCategory.map((category) => (
              <section key={category.id}>
                <div className="flex items-center gap-4 mb-6">
                   <h3 className="text-lg font-bold text-slate-800">{category.emoji} {category.name}</h3>
                   <div className="h-[1px] flex-1 bg-slate-200/50" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.items.map((product: any) => (
                    <div 
                      key={product.id} 
                      className={`card-premium group relative flex flex-col h-full !p-4 ${product.isActive === false ? 'opacity-70 saturate-50' : ''}`}
                    >
                      <div className="absolute top-3 left-3 z-10">
                        <button 
                          onClick={() => toggleStatus(product)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tight transition-all shadow-sm ${
                            product.isActive !== false 
                              ? "bg-green-500 text-white" 
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          <div className={`w-1 h-1 rounded-full ${product.isActive !== false ? "bg-white animate-pulse" : "bg-slate-400"}`} />
                          {product.isActive !== false ? "Visível" : "Oculto"}
                        </button>
                      </div>

                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 backdrop-blur-sm text-slate-300 hover:text-red-500 rounded-lg shadow-sm transition-all"
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="relative h-32 mb-4 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-200">
                             <Package size={30} />
                          </div>
                        )}
                        {isShowcase && (
                          <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-none">
                            VITRINE
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <div className="flex flex-col mb-3">
                           <h4 className="font-bold text-navy text-sm line-clamp-1">{product.name}</h4>
                           <div className="text-sm font-black text-orange-500 mt-0.5">
                              R$ {product.price.toFixed(2).replace('.', ',')}
                           </div>
                        </div>

                        <div className="mt-auto pt-3 border-t border-slate-50 flex items-center gap-2">
                           <button 
                              onClick={() => { setEditingProduct(product); setFormData({...product, price: product.price.toString(), barcode: product.barcode || "" }); setIsModalOpen(true); }}
                              className="p-2 bg-navy text-white rounded-lg hover:bg-orange-500 transition-all flex items-center justify-center shadow-sm"
                           >
                              <Edit3 size={14} />
                           </button>

                           {isShowcase ? (
                             <button 
                                onClick={() => { setEditingProduct(product); setIsVariantModalOpen(true); }}
                                className="flex-1 py-2 border-2 border-orange-100 text-orange-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center justify-center gap-1.5"
                             >
                                <Palette size={12} />
                                Variações
                             </button>
                           ) : (
                             <button 
                                onClick={() => { setEditingProduct(product); fetchOptions(product.id); setIsOptionsModalOpen(true); }}
                                className="flex-1 py-2 border-2 border-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-orange-200 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-1.5"
                             >
                                <PlusSquare size={12} />
                                Opcionais
                             </button>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PRODUTO (FUNCIONA PARA AMBOS OS TIPOS) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-lg rounded-[40px] p-8 lg:p-12 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-2xl font-bold text-navy">{isShowcase ? "Produto da Vitrine" : "Produto"}</h2>
                <p className="text-slate-400 text-xs mt-1 font-medium">
                  {isShowcase ? "Depois adicione as variações de cor." : "Insira os detalhes do item no menu."}
                </p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><X size={20}/></button>
            </div>
            
            <div className="space-y-5">
              <input className="input-field" placeholder="Nome do Produto" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <input className="input-field" placeholder="Preço (R$)" type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                <select className="input-field" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {isShowcase && (
                <input className="input-field" placeholder="Código de Barras (Opcional)" value={formData.barcode || ""} onChange={e => setFormData({...formData, barcode: e.target.value})} />
              )}
              <textarea className="input-field h-24 resize-none" placeholder="Descrição..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              
              <label className="block border-2 border-dashed border-slate-100 p-6 rounded-2xl text-center hover:bg-slate-50/50 cursor-pointer transition-all">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden border border-slate-100">
                    {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <Camera size={20} className="text-slate-200" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-700">{uploading ? "Sincronizando..." : isShowcase ? "Foto principal do produto" : "Escolher foto"}</p>
                    <p className="text-[10px] text-slate-400">Convertida automaticamente para WebP</p>
                  </div>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>

            <button type="submit" className="w-full btn-primary py-4.5 mt-10 rounded-2xl">
              {isShowcase ? "Salvar Produto" : "Confirmar Catalogação"}
            </button>
          </form>
        </div>
      )}

      {/* MODAL VARIANTES (VITRINE) */}
      {isVariantModalOpen && editingProduct && (
        <VariantEditor
          productId={editingProduct.id}
          productName={editingProduct.name}
          onClose={() => setIsVariantModalOpen(false)}
        />
      )}

      {/* MODAL ADICIONAIS (LANCHONETE) */}
      {isOptionsModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-8 lg:p-10 border-b border-slate-100 flex justify-between items-center bg-navy text-white">
               <div>
                  <h2 className="text-xl font-bold tracking-tight">Opcionais</h2>
                  <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest mt-1">{editingProduct?.name}</p>
               </div>
               <button onClick={() => setIsOptionsModalOpen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                    <h4 className="text-xs font-bold text-navy uppercase tracking-widest flex items-center gap-2">
                       <PlusCircle className="text-orange-500" size={16} /> 
                       Novo Grupo
                    </h4>
                    <input placeholder="Ex: Adicionais de Hambúrguer" className="input-field" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white p-4 rounded-2xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Mín</span>
                          <input type="number" className="bg-transparent font-black text-navy w-full outline-none" value={minSelect} onChange={e => setMinSelect(Number(e.target.value))} />
                       </div>
                       <div className="bg-white p-4 rounded-2xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Máx</span>
                          <input type="number" className="bg-transparent font-black text-navy w-full outline-none" value={maxSelect} onChange={e => setMaxSelect(Number(e.target.value))} />
                       </div>
                    </div>
                    <label className="flex items-center gap-4 cursor-pointer group">
                      <div 
                        onClick={() => setIsMandatory(!isMandatory)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isMandatory ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/20' : 'border-slate-200'}`}
                      >
                         {isMandatory && <X size={12} className="text-white" />}
                      </div>
                      <span className="text-xs font-bold text-slate-600">Este grupo é obrigatório?</span>
                    </label>
                    <button onClick={addOptionGroup} className="w-full btn-primary !py-4">Criar Grupo</button>
                  </div>
               </div>

               <div className="space-y-6">
                 {optionGroups.map(group => (
                   <div key={group.id} className="bg-white border border-slate-100 rounded-[32px] p-6 space-y-5 shadow-sm">
                      <div className="flex justify-between items-start">
                         <div>
                            <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-md">{group.minOptions > 0 ? "Obrigatório" : "Opcional"}</span>
                            <h5 className="font-bold text-slate-800 text-base mt-2">{group.name}</h5>
                         </div>
                         <button onClick={() => deleteOptionGroup(group.id)} className="text-slate-300 hover:text-red-400 transition-all"><Trash2 size={18}/></button>
                      </div>

                      <div className="space-y-2">
                         {group.options?.map((opt: any) => (
                           <div key={opt.id} className="flex justify-between items-center py-2 border-b border-slate-50">
                              <span className="text-xs font-semibold text-slate-600">{opt.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-orange-500">+ R${opt.price.toFixed(2)}</span>
                                <button onClick={() => deleteOptionItem(opt.id)} className="text-slate-200 hover:text-red-400 transition-all"><X size={14}/></button>
                              </div>
                           </div>
                         ))}
                      </div>

                      {addingItemToGroup === group.id ? (
                        <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                           <div className="grid grid-cols-2 gap-2">
                              <input placeholder="Nome" className="input-field !py-2 !text-xs" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                              <input placeholder="Preço" type="number" className="input-field !py-2 !text-xs" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => addOptionItem(group.id)} className="flex-1 bg-navy text-white text-[10px] font-bold uppercase py-2.5 rounded-xl">Confirmar</button>
                              <button onClick={() => setAddingItemToGroup(null)} className="flex-1 bg-white border border-slate-100 text-slate-400 text-[10px] font-bold uppercase py-2.5 rounded-xl">Cancelar</button>
                           </div>
                        </div>
                      ) : (
                        <button onClick={() => setAddingItemToGroup(group.id)} className="w-full py-3 border border-dashed border-slate-200 text-slate-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 transition-all">+ Adicionar Item</button>
                      )}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Produto?"
        message="Esta ação não pode ser desfeita."
        confirmText="Excluir Agora"
      />
    </>
  );
}
