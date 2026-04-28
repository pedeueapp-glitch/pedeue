"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, Edit3, Trash2, Loader2, X, PlusSquare,
  Package, Camera, AlertCircle, CheckCircle2, PlusCircle, Palette,
  Calculator, TrendingUp, Copy, Wand2, Globe
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
  const [importModal, setImportModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [savingImport, setSavingImport] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importText, setImportText] = useState("");
  const [importMode, setImportMode] = useState<"url" | "text">("url");
  const [importPreview, setImportPreview] = useState<any>(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const [formData, setFormData] = useState({
    name: "", description: "", price: "", salePrice: "", categoryId: "",
    imageUrl: "", inStock: true, isActive: true, barcode: "",
    isCombo: false, comboConfig: "[]",
    purchasePrice: "", profitMargin: "",
    isBestSeller: false, isFavorite: false
  });

  const [uploading, setUploading] = useState(false);
  const [optionGroups, setOptionGroups] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [minSelect, setMinSelect] = useState(0);
  const [maxSelect, setMaxSelect] = useState(1);
  const [isMandatory, setIsMandatory] = useState(false);
  const [priceCalculation, setPriceCalculation] = useState("SUM");
  const [addingItemToGroup, setAddingItemToGroup] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const comboItems = JSON.parse(formData.comboConfig || "[]");

  const toggleComboItem = (productId: string) => {
    let newItems = [...comboItems];
    if (newItems.includes(productId)) {
      newItems = newItems.filter(id => id !== productId);
    } else {
      newItems.push(productId);
    }
    
    // Auto-calculate price based on sum of items
    const selectedProducts = products.filter(p => newItems.includes(p.id));
    const totalPrice = selectedProducts.reduce((acc, p) => acc + p.price, 0);
    
    setFormData(prev => ({ 
      ...prev, 
      comboConfig: JSON.stringify(newItems),
      price: totalPrice.toString() 
    }));
  };

  const isShowcase = storeType === "SHOWCASE" || storeType === "SERVICE";
  const isService = storeType === "SERVICE";

  const calculateSellingPrice = (purchasePrice: string, margin: string) => {
    const p = parseFloat(purchasePrice || "0");
    const m = parseFloat(margin || "0");
    if (isNaN(p) || isNaN(m)) return 0;
    return p + (p * (m / 100));
  };

  // Sync price if in Service mode
  useEffect(() => {
    if (isService && (formData.purchasePrice || formData.profitMargin)) {
      const calculated = calculateSellingPrice(formData.purchasePrice, formData.profitMargin);
      setFormData(prev => ({ ...prev, price: calculated.toFixed(2) }));
    }
  }, [formData.purchasePrice, formData.profitMargin, isService]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
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
    } catch { toast.error("Erro ao carregar"); } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleImport = async () => {
    if (importMode === "url" && !importUrl) return toast.error("Cole uma URL do cardápio");
    if (importMode === "text" && !importText) return toast.error("Cole o texto do cardápio");

    setImporting(true);
    setImportPreview(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: importMode === "url" ? importUrl : undefined,
          text: importMode === "text" ? importText : undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na importação");
      setImportPreview(data);
      toast.success("Cardápio analisado com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  const saveImport = async () => {
    if (!importPreview) return;
    setSavingImport(true);
    try {
      const res = await fetch("/api/import/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importPreview),
      });
      if (!res.ok) throw new Error("Erro ao salvar cardápio");
      toast.success("Cardápio importado com sucesso!");
      setImportModal(false);
      setImportPreview(null);
      setImportUrl("");
      setImportText("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingImport(false);
    }
  };

  const generateAIDescription = async () => {
    if (!formData.name) return toast.error("Digite o nome do produto primeiro");
    
    setGeneratingDescription(true);
    try {
      const res = await fetch("/api/products/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, storeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setFormData(prev => ({ ...prev, description: data.description }));
      toast.success("Descrição gerada!");
    } catch (err: any) {
      toast.error("Erro ao gerar descrição");
    } finally {
      setGeneratingDescription(false);
    }
  };

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
      toast.success(isService ? "Serviço salvo!" : (isShowcase ? "Produto da Vitrine salvo!" : "Salvo com sucesso!"));
      setIsModalOpen(false);
      fetchData();
    } catch { toast.error("Erro ao salvar"); }
  };

  const toggleStatus = async (product: any) => {
    // Atualização otimista
    const originalProducts = [...products];
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, price: product.price.toString(), isActive: !product.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status atualizado");
      fetchData(true); // Sincroniza silenciosamente
    } catch { 
      toast.error("Erro ao atualizar status"); 
      setProducts(originalProducts); // Rollback
    }
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

  const duplicateProduct = async (id: string) => {
    setDuplicatingId(id);
    const toastId = toast.loading("Duplicando produto...");
    try {
      const res = await fetch(`/api/products/${id}/duplicate`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao duplicar");
      }
      const newProduct = await res.json();
      
      setProducts(prev => [newProduct, ...prev]);
      toast.success("Produto duplicado!", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Erro ao duplicar", { id: toastId });
    } finally {
      setDuplicatingId(null);
    }
  };

  const fetchOptions = async (productId: string) => {
    const res = await fetch(`/api/products/options?productId=${productId}`);
    const data = await res.json();
    setOptionGroups(Array.isArray(data) ? data : []);
  };

  const saveOptionGroup = async () => {
    if (!newGroupName) return;
    const method = editingGroupId ? "PATCH" : "POST";
    await fetch("/api/products/options", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: editingGroupId || undefined,
        productId: editingProduct.id, 
        name: newGroupName, 
        minChoices: isMandatory ? 1 : 0, 
        maxChoices: maxSelect, 
        priceCalculation 
      }),
    });
    setNewGroupName("");
    setEditingGroupId(null);
    setPriceCalculation("SUM");
    setIsMandatory(false);
    setMinSelect(0);
    setMaxSelect(1);
    fetchOptions(editingProduct.id);
  };

  const saveOptionItem = async (groupId: string) => {
    if (!newItemName) return;
    const method = editingItemId ? "PATCH" : "POST";
    await fetch("/api/products/options/item", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: editingItemId || undefined,
        groupId, 
        name: newItemName, 
        price: parseFloat(newItemPrice || "0") 
      }),
    });
    setNewItemName(""); 
    setNewItemPrice(""); 
    setAddingItemToGroup(null);
    setEditingItemId(null);
    fetchOptions(editingProduct.id);
  };

  const toggleOptionItem = async (itemId: string, currentStatus: boolean) => {
    await fetch("/api/products/options/item", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, isActive: !currentStatus }),
    });
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
      <Header title={isService ? "Gestão de Papelaria & Serviços" : (isShowcase ? "Catálogo da Vitrine" : "Gerenciamento de Cardápio")} />

      {(storeType === "SHOWCASE" || storeType === "SERVICE") && (
        <div className="mx-6 lg:mx-10 mt-6 p-4 bg-purple-50 border border-purple-200 rounded-none flex items-center gap-3">
          <Palette size={18} className="text-purple-500 flex-shrink-0" />
          <p className="text-xs font-bold text-purple-700">
            Modo {isService ? "Orçamento Papelaria" : "Vitrine Online"} ativo. {isService ? "Seu sistema agora calcula lucros automaticamente com base nos custos." : "Gerencie cores, tamanhos e fotos individuais clicando em Variações."}
          </p>
        </div>
      )}

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isService ? "Catálogo de Serviços" : (isShowcase ? "Produtos da Vitrine" : "Lista de Itens")}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {isService ? "Gerencie seus itens e calcule margens de lucro." : (isShowcase ? "Configure produtos com cores e tamanhos." : "Configure seus produtos e categorias.")}
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
              onClick={() => setImportModal(true)}
              className="flex-1 md:flex-none btn-secondary !bg-purple-50 !text-purple-600 !border-purple-100 hover:!bg-purple-100 flex items-center justify-center gap-2 !py-3.5 !rounded-2xl font-bold"
            >
              <Wand2 className="w-4 h-4" /> 
              <span className="hidden sm:inline">Importador Mágico</span>
            </button>

            <button 
              onClick={() => {
                setEditingProduct(null);
                setFormData({ 
                  name: "", description: "", price: "", salePrice: "", categoryId: categories[0]?.id || "", 
                  imageUrl: "", inStock: true, isActive: true, barcode: "",
                  isCombo: false, comboConfig: "[]",
                  purchasePrice: "", profitMargin: "",
                  isBestSeller: false, isFavorite: false
                });
                setIsModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2 !py-3.5 !rounded-2xl"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">{isService ? "Novo Serviço" : (isShowcase ? "Novo Produto" : "Adicionar Produto")}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
            <span className="font-black  tracking-widest text-[10px] text-slate-400">Sincronizando...</span>
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
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black  tracking-tight transition-all shadow-sm ${
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
                          <div className="absolute bottom-2 right-2 bg-purple-500 text-white text-[8px] font-black  px-2 py-0.5 rounded-none">
                            {isService ? "SERVIÇO" : "VITRINE"}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <div className="flex flex-col mb-3">
                           <h4 className="font-bold text-navy text-sm line-clamp-1">{product.name}</h4>
                           <div className="text-sm font-black text-purple-500 mt-0.5">
                              {product.salePrice ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 line-through">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                                  <span>R$ {product.salePrice.toFixed(2).replace('.', ',')}</span>
                                </div>
                              ) : (
                                <>R$ {product.price.toFixed(2).replace('.', ',')}</>
                              )}
                           </div>
                           {isService && product.purchasePrice > 0 && (
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-green-600  bg-green-50 px-1.5 py-0.5 rounded-md">Margem: {product.profitMargin}%</span>
                             </div>
                           )}
                        </div>

                        <div className="mt-auto pt-3 border-t border-slate-50 flex items-center gap-2">
                           <button 
                              onClick={() => { 
                                setEditingProduct(product); 
                                setFormData({
                                  ...product, 
                                  price: product.price.toString(), 
                                  salePrice: product.salePrice ? product.salePrice.toString() : "",
                                  barcode: product.barcode || "",
                                  isCombo: product.isCombo || false,
                                  comboConfig: product.comboConfig || "[]",
                                  purchasePrice: product.purchasePrice ? product.purchasePrice.toString() : "",
                                  profitMargin: product.profitMargin ? product.profitMargin.toString() : "",
                                  isBestSeller: product.isBestSeller || false,
                                  isFavorite: product.isFavorite || false
                                }); 
                                setIsModalOpen(true); 
                              }}
                              className="w-full py-2 bg-navy text-white rounded-lg hover:bg-purple-500 transition-all flex items-center justify-center gap-2 shadow-sm text-[10px] font-black  tracking-widest"
                           >
                              <Edit3 size={14} />
                              Editar
                           </button>

                           {!isService && (
                             isShowcase ? (
                               <div className="flex gap-1.5">
                                 <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); duplicateProduct(product.id); }}
                                    className="p-2 border-2 border-slate-100 text-slate-400 rounded-lg hover:border-purple-200 hover:text-purple-500 hover:bg-purple-50 transition-all"
                                    title="Duplicar"
                                 >
                                    <Copy size={14} />
                                 </button>
                                 <button 
                                    type="button"
                                    onClick={() => { setEditingProduct(product); setIsVariantModalOpen(true); }}
                                    className="p-2 border-2 border-purple-100 text-purple-500 rounded-lg hover:bg-purple-50 transition-all"
                                 >
                                    <Palette size={14} />
                                 </button>
                               </div>
                             ) : (
                               <div className="flex gap-1.5">
                                 <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); duplicateProduct(product.id); }}
                                    className="p-2 border-2 border-slate-100 text-slate-400 rounded-lg hover:border-purple-200 hover:text-purple-500 hover:bg-purple-50 transition-all"
                                    title="Duplicar"
                                 >
                                    <Copy size={14} />
                                 </button>
                                 <button 
                                    type="button"
                                    onClick={() => { setEditingProduct(product); fetchOptions(product.id); setIsOptionsModalOpen(true); }}
                                    className="p-2 border-2 border-slate-100 text-slate-500 rounded-lg hover:border-purple-200 hover:text-purple-500 hover:bg-purple-50 transition-all"
                                 >
                                    <PlusSquare size={14} />
                                 </button>
                               </div>
                             )
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

      {/* MODAL PRODUTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-lg rounded-[40px] p-8 lg:p-12 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-2xl font-bold text-navy">{isService ? "Configurar Serviço" : (isShowcase ? "Produto da Vitrine" : "Produto")}</h2>
                <p className="text-slate-400 text-xs mt-1 font-medium">
                  {isService ? "Calcule custos e lucros automaticamente." : "Preencha as informações do item."}
                </p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><X size={20}/></button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Nome do Item</label>
                <input className="input-field" placeholder="Ex: Caderno Personalizado" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>

              {isService && (
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="text-purple-500" size={16} />
                    <h4 className="text-[10px] font-black text-navy  tracking-widest">Cálculo de Custo e Lucro</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Custo Un. (R$)</label>
                      <input className="input-field bg-white" type="number" step="0.01" placeholder="0.00" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Margem (%)</label>
                      <div className="relative">
                        <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input className="input-field bg-white pl-11" type="number" placeholder="100" value={formData.profitMargin} onChange={e => setFormData({...formData, profitMargin: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200/50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500  tracking-widest">Preço Original Sugerido:</span>
                    <span className="text-lg font-black text-navy">R$ {calculateSellingPrice(formData.purchasePrice, formData.profitMargin).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">{isService ? "Preço Final (Calculado)" : "Preço Original (R$)"}</label>
                  <input className="input-field" placeholder="0,00" type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Preço de Oferta (Opcional)</label>
                  <input className="input-field" placeholder="0,00" type="number" step="0.01" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Categoria</label>
                <select className="input-field" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                  <option value="">Selecione uma categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {isShowcase && !isService && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Código de Barras / SKU</label>
                  <input className="input-field" placeholder="Opcional" value={formData.barcode || ""} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.isBestSeller} 
                    onChange={e => setFormData({...formData, isBestSeller: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-200 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-navy uppercase">Mais Pedido</span>
                    <span className="text-[9px] text-slate-500">Exibe selo de destaque</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.isFavorite} 
                    onChange={e => setFormData({...formData, isFavorite: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-200 text-pink-500 focus:ring-pink-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-navy uppercase">Queridinho</span>
                    <span className="text-[9px] text-slate-500">Exibe selo de favorito</span>
                  </div>
                </label>
              </div>

              {!isService && storeType === "RESTAURANT" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input 
                      type="checkbox" 
                      checked={formData.isCombo} 
                      onChange={e => setFormData({...formData, isCombo: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-200 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-xs font-black  text-navy">Este produto é um COMBO?</span>
                  </label>
                  
                  {formData.isCombo && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black  text-slate-400 mb-2">Selecione os itens do combo:</p>
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-2">
                        {products.filter(p => !p.isCombo).map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleComboItem(p.id)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-[10px] font-bold transition-all ${
                              comboItems.includes(p.id) 
                                ? "bg-purple-500 text-white shadow-md" 
                                : "bg-white text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span>{p.name}</span>
                            <span>R$ {p.price.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Descrição Detalhada</label>
                  <button 
                    type="button"
                    onClick={generateAIDescription}
                    disabled={generatingDescription || !formData.name}
                    className="text-[9px] font-black text-purple-600 hover:text-purple-700 flex items-center gap-1 uppercase tracking-widest disabled:opacity-50 transition-all"
                  >
                    {generatingDescription ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3" />
                    )}
                    Gerar com IA
                  </button>
                </div>
                <textarea className="input-field h-24 resize-none !rounded-2xl" placeholder="Fale sobre o produto/serviço..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              
              <label className="block border-2 border-dashed border-slate-100 p-6 rounded-2xl text-center hover:bg-slate-50/50 cursor-pointer transition-all">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden border border-slate-100">
                    {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <Camera size={20} className="text-slate-200" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-700">{uploading ? "Sincronizando..." : "Foto do Item"}</p>
                    <p className="text-[10px] text-slate-400">Clique para alterar</p>
                  </div>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>

            <button type="submit" className="w-full btn-primary py-4.5 mt-10 rounded-2xl shadow-xl shadow-purple-500/20">
              {isService ? "Salvar Serviço" : (isShowcase ? "Salvar Produto" : "Confirmar Catalogação")}
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
                  <p className="text-purple-500 text-[10px] font-bold  tracking-widest mt-1">{editingProduct?.name}</p>
               </div>
               <button onClick={() => setIsOptionsModalOpen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                    <h4 className="text-xs font-bold text-navy  tracking-widest flex items-center gap-2">
                       <PlusCircle className="text-purple-500" size={16} /> 
                       Novo Grupo
                    </h4>
                    <input placeholder="Ex: Adicionais de Hambúrguer" className="input-field" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white p-4 rounded-2xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400  block mb-1">Mín</span>
                          <input type="number" className="bg-transparent font-black text-navy w-full outline-none" value={minSelect} onChange={e => setMinSelect(Number(e.target.value))} />
                       </div>
                       <div className="bg-white p-4 rounded-2xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400  block mb-1">Máx</span>
                          <input type="number" className="bg-transparent font-black text-navy w-full outline-none" value={maxSelect} onChange={e => setMaxSelect(Number(e.target.value))} />
                       </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                       <span className="text-[9px] font-bold text-slate-400 block mb-2">Formato de Cobrança</span>
                       <select 
                         className="bg-transparent font-black text-navy text-xs w-full outline-none"
                         value={priceCalculation}
                         onChange={e => setPriceCalculation(e.target.value)}
                       >
                         <option value="SUM">Soma dos Valores (Padrão)</option>
                         <option value="HIGHEST">Cobrar o Maior Valor (Ex: Pizza)</option>
                         <option value="AVERAGE">Média dos Valores</option>
                       </select>
                    </div>

                    <label className="flex items-center gap-4 cursor-pointer group">
                      <div 
                        onClick={() => setIsMandatory(!isMandatory)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isMandatory ? 'bg-purple-500 border-purple-500 shadow-lg shadow-purple-500/20' : 'border-slate-200'}`}
                      >
                         {isMandatory && <X size={12} className="text-white" />}
                      </div>
                      <span className="text-xs font-bold text-slate-600">Este grupo é obrigatório?</span>
                    </label>
                    <div className="flex gap-2">
                       <button onClick={saveOptionGroup} className="flex-1 btn-primary !py-4">
                         {editingGroupId ? "Salvar Alterações" : "Criar Grupo"}
                       </button>
                       {editingGroupId && (
                         <button 
                           onClick={() => {
                             setEditingGroupId(null);
                             setNewGroupName("");
                             setMinSelect(0);
                             setMaxSelect(1);
                             setIsMandatory(false);
                             setPriceCalculation("SUM");
                           }}
                           className="px-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all font-bold text-xs"
                         >
                           Cancelar
                         </button>
                       )}
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                 {optionGroups.map(group => (
                   <div key={group.id} className="bg-white border border-slate-100 rounded-[32px] p-6 space-y-5 shadow-sm">
                      <div className="flex justify-between items-start">
                         <div>
                            <span className="text-[9px] font-bold text-purple-500  tracking-widest bg-purple-50 px-2 py-1 rounded-md">{group.minOptions > 0 ? "Obrigatório" : "Opcional"}</span>
                            <h5 className="font-bold text-slate-800 text-base mt-2">{group.name}</h5>
                         </div>
                         <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingGroupId(group.id);
                                setNewGroupName(group.name);
                                setMinSelect(group.minOptions);
                                setMaxSelect(group.maxOptions);
                                setIsMandatory(group.minOptions > 0);
                                setPriceCalculation(group.priceCalculation || "SUM");
                              }} 
                              className="text-slate-300 hover:text-purple-500 transition-all"
                            >
                              <Edit3 size={16}/>
                            </button>
                            <button onClick={() => deleteOptionGroup(group.id)} className="text-slate-300 hover:text-red-400 transition-all"><Trash2 size={16}/></button>
                         </div>
                      </div>

                      <div className="space-y-2">
                         {group.options?.map((opt: any) => (
                           <div key={opt.id} className={`flex justify-between items-center py-2 border-b border-slate-50 ${opt.isActive === false ? 'opacity-40 grayscale' : ''}`}>
                               <div className="flex items-center gap-3">
                                  <button 
                                    onClick={() => toggleOptionItem(opt.id, opt.isActive !== false)}
                                    className={`w-3 h-3 rounded-full ${opt.isActive !== false ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-slate-300'}`}
                                    title={opt.isActive !== false ? "Desativar" : "Ativar"}
                                  />
                                  <span className="text-xs font-semibold text-slate-600">{opt.name}</span>
                               </div>
                               <div className="flex items-center gap-4">
                                 <span className="text-xs font-black text-purple-500">+ R${opt.price.toFixed(2)}</span>
                                 <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => {
                                        setAddingItemToGroup(group.id);
                                        setEditingItemId(opt.id);
                                        setNewItemName(opt.name);
                                        setNewItemPrice(opt.price.toString());
                                      }}
                                      className="text-slate-200 hover:text-purple-400 transition-all"
                                    >
                                      <Edit3 size={12}/>
                                    </button>
                                    <button onClick={() => deleteOptionItem(opt.id)} className="text-slate-200 hover:text-red-400 transition-all"><X size={14}/></button>
                                 </div>
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
                              <button onClick={() => saveOptionItem(group.id)} className="flex-1 bg-navy text-white text-[10px] font-bold  py-2.5 rounded-xl">
                                {editingItemId ? "Salvar" : "Confirmar"}
                              </button>
                              <button onClick={() => { setAddingItemToGroup(null); setEditingItemId(null); setNewItemName(""); setNewItemPrice(""); }} className="flex-1 bg-white border border-slate-100 text-slate-400 text-[10px] font-bold  py-2.5 rounded-xl">Cancelar</button>
                           </div>
                        </div>
                      ) : (
                        <button onClick={() => { setAddingItemToGroup(group.id); setEditingItemId(null); setNewItemName(""); setNewItemPrice(""); }} className="w-full py-3 border border-dashed border-slate-200 text-slate-400 rounded-2xl text-[10px] font-bold  tracking-widest hover:border-purple-500 hover:text-purple-500 transition-all">+ Adicionar Item</button>
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

      {/* MODAL DE IMPORTAÇÃO */}
      {importModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy">Importador Mágico</h3>
                  <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">Traga seu cardápio em segundos</p>
                </div>
              </div>
              <button onClick={() => setImportModal(false)} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-navy transition-all"><X size={18} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 scrollbar-hide">
              {!importPreview ? (
                <div className="space-y-4">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setImportMode("url")}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all ${importMode === "url" ? "bg-white shadow-sm text-purple-600" : "text-slate-500"}`}
                    >
                      Via Link
                    </button>
                    <button 
                      onClick={() => setImportMode("text")}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all ${importMode === "text" ? "bg-white shadow-sm text-purple-600" : "text-gray-500"}`}
                    >
                      Copiar e Colar
                    </button>
                  </div>

                  {importMode === "url" ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-bold text-blue-700 leading-relaxed">
                          Nossa IA vai identificar os produtos, preços e categorias automaticamente.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 tracking-widest ml-1">URL DO CARDÁPIO</label>
                        <div className="relative">
                          <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                            type="url" 
                            placeholder="Ex: https://ifood.com.br/restaurante-exemplo"
                            className="input-field !pl-10 !rounded-xl !py-2.5 text-sm"
                            value={importUrl}
                            onChange={e => setImportUrl(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-bold text-purple-700 leading-relaxed">
                          Selecione tudo (Ctrl+A), copie (Ctrl+C) e cole o texto do seu cardápio abaixo.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 tracking-widest ml-1">TEXTO DO CARDÁPIO</label>
                        <textarea 
                          placeholder="Cole o conteúdo aqui..."
                          className="input-field min-h-[180px] !py-4 !rounded-xl resize-none text-sm"
                          value={importText}
                          onChange={e => setImportText(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleImport}
                    disabled={importing || (importMode === "url" ? !importUrl : !importText)}
                    className="btn-primary w-full h-12 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-purple-500/10"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Aguarde...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Processar Cardápio
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-navy text-sm">Itens Encontrados ({importPreview.categories?.length})</h4>
                    <button onClick={() => setImportPreview(null)} className="text-[9px] text-purple-600 font-black tracking-widest uppercase hover:underline">Alterar Link</button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-hide">
                    {importPreview.categories?.map((cat: any, idx: number) => (
                      <div key={idx} className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50">
                        <div className="font-bold text-navy text-xs mb-1 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {cat.name}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-6">
                          {cat.products?.length} produtos
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                      Ao confirmar, criaremos as categorias e produtos. Você poderá editá-los depois no painel.
                    </p>
                  </div>

                  <button 
                    onClick={saveImport}
                    disabled={savingImport}
                    className="btn-primary w-full h-12 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 rounded-xl"
                  >
                    {savingImport ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Importar Tudo Agora
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

