"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Loader2, 
  X, 
  PlusCircle, 
  MinusCircle,
  Tag,
  Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";

interface Option {
  id?: string;
  name: string;
  price: string;
  isActive: boolean;
}

interface OptionGroup {
  id?: string;
  name: string;
  minOptions: string;
  maxOptions: string;
  isRequired: boolean;
  priceCalculation: "SUM" | "HIGHEST" | "AVERAGE";
  options: Option[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  inStock: boolean;
  categoryId: string;
  optionGroups?: OptionGroup[];
}

interface Category {
  id: string;
  name: string;
  emoji?: string;
  products: Product[];
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "", 
    description: "", 
    price: "", 
    imageUrl: "", 
    categoryId: "", 
    isActive: true, 
    inStock: true,
    optionGroups: [] as OptionGroup[]
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/store");
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Falha ao carregar dados");
      }
      
      console.log("Dados da loja carregados:", data);
      setCategories(data.categories || []);
    } catch (error: any) {
      console.error("Erro no fetch:", error);
      toast.error(error.message || "Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...productForm, price: parseFloat(productForm.price) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }
      toast.success(editingProduct ? "Produto atualizado!" : "Produto criado!");
      setProductModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Deletar este produto?")) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      toast.success("Produto removido");
      loadData();
    } catch {
      toast.error("Erro ao remover produto");
    }
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      imageUrl: product.imageUrl || "",
      categoryId: product.categoryId,
      isActive: product.isActive,
      inStock: product.inStock,
      optionGroups: product.optionGroups?.map(g => ({
        ...g,
        minOptions: g.minOptions.toString(),
        maxOptions: g.maxOptions.toString(),
        options: g.options.map(o => ({ ...o, price: o.price.toString() }))
      })) || []
    });
    setProductModal(true);
  }

  // Option Handlers
  const addOptionGroup = () => {
    setProductForm(prev => ({
      ...prev,
      optionGroups: [...prev.optionGroups, {
        name: "", minOptions: "0", maxOptions: "1", isRequired: false, priceCalculation: "SUM",
        options: [{ name: "", price: "0", isActive: true }]
      }]
    }));
  };

  const updateGroup = (idx: number, field: string, value: any) => {
    const newGroups = [...productForm.optionGroups];
    (newGroups[idx] as any)[field] = value;
    setProductForm({...productForm, optionGroups: newGroups});
  };

  const addOptionToGroup = (gIdx: number) => {
    const newGroups = [...productForm.optionGroups];
    newGroups[gIdx].options.push({ name: "", price: "0", isActive: true });
    setProductForm({...productForm, optionGroups: newGroups});
  };

  const updateOption = (gIdx: number, oIdx: number, field: string, value: any) => {
    const newGroups = [...productForm.optionGroups];
    (newGroups[gIdx].options[oIdx] as any)[field] = value;
    setProductForm({...productForm, optionGroups: newGroups});
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Produtos</h2>
          <p className="text-gray-500 text-sm">Gerencie seu cardápio e estoque</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setProductForm({ 
              name: "", description: "", price: "", imageUrl: "", categoryId: categories[0]?.id || "", 
              isActive: true, inStock: true, optionGroups: [] 
            });
            setProductModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      <div className="space-y-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{cat.emoji}</span>
                <span className="font-bold text-gray-800">{cat.name}</span>
              </div>
              <span className="badge bg-gray-200 text-gray-600">{cat.products.length} itens</span>
            </div>
            <div className="divide-y divide-gray-50">
              {cat.products.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm italic">Nenhum produto cadastrado nesta categoria</div>
              ) : (
                cat.products.map(product => (
                  <div key={product.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
                        {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package className="text-gray-300 w-8 h-8" />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{product.name}</div>
                        <div className="text-purple-600 font-black">R$ {product.price.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditProduct(product)} className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-xl flex items-center justify-center transition-all">
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button onClick={() => deleteProduct(product.id)} className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {productModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-bold">{editingProduct ? "Editar Produto" : "Novo Produto"}</h3>
              <button onClick={() => setProductModal(false)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            
            <form onSubmit={saveProduct} className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Categoria</label>
                   <select 
                    className="input-field" 
                    value={productForm.categoryId}
                    onChange={e => setProductForm({...productForm, categoryId: e.target.value})}
                    required
                   >
                     {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Produto</label>
                   <input type="text" className="input-field" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-bold text-gray-700 mb-2">Descrição</label>
                   <textarea className="input-field !py-3" rows={2} value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Preço Base (R$)</label>
                   <input type="number" step="0.01" className="input-field" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} required />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">URL da Imagem</label>
                   <div className="relative">
                    <ImageIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" className="input-field !pl-11" value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} />
                   </div>
                 </div>
               </div>
               
               {/* ADICIONAIS / SABORES */}
               <div className="pt-6 border-t border-gray-100">
                 <div className="flex items-center justify-between mb-6">
                   <h4 className="font-bold text-gray-800 flex items-center gap-2">
                     <PlusCircle className="w-5 h-5 text-purple-500" />
                     Adicionais / Sabores
                   </h4>
                   <button type="button" onClick={addOptionGroup} className="text-purple-500 font-bold text-sm hover:underline">+ Novo Grupo</button>
                 </div>

                 <div className="space-y-6">
                   {productForm.optionGroups.map((group, gIdx) => (
                     <div key={gIdx} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 relative">
                       <button 
                        type="button" 
                        onClick={() => updateGroup(gIdx, "removed", true)} // Lógica simplificada: filter na hora de salvar
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-100 text-red-500 rounded-full flex items-center justify-center shadow-sm"
                        title="Remover grupo"
                       >
                         <MinusCircle className="w-5 h-5" />
                       </button>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                         <div className="sm:col-span-2">
                           <input 
                            type="text" 
                            className="input-field !bg-white" 
                            placeholder="Ex: Escolha o Sabor ou Adicionais" 
                            value={group.name}
                            onChange={e => updateGroup(gIdx, "name", e.target.value)}
                           />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="text-[10px] font-bold text-gray-400 ">Mínimo</label>
                             <input type="number" className="input-field !py-2 !bg-white" value={group.minOptions} onChange={e => updateGroup(gIdx, "minOptions", e.target.value)} />
                           </div>
                           <div>
                             <label className="text-[10px] font-bold text-gray-400 ">Máximo</label>
                             <input type="number" className="input-field !py-2 !bg-white" value={group.maxOptions} onChange={e => updateGroup(gIdx, "maxOptions", e.target.value)} />
                           </div>
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-gray-400 ">Cálculo de Preço</label>
                           <select 
                            className="input-field !py-2 !bg-white"
                            value={group.priceCalculation}
                            onChange={e => updateGroup(gIdx, "priceCalculation", e.target.value)}
                           >
                             <option value="SUM">Soma Tudo (Adicionais)</option>
                             <option value="HIGHEST">Maior Valor (Sabores Pizza)</option>
                           </select>
                         </div>
                       </div>

                       <div className="space-y-3 pl-4 border-l-2 border-purple-200">
                         {group.options.map((opt, oIdx) => (
                           <div key={oIdx} className="flex items-center gap-3">
                             <input 
                              type="text" 
                              className="input-field !py-2 flex-1 !bg-white" 
                              placeholder="Nome da Opção" 
                              value={opt.name}
                              onChange={e => updateOption(gIdx, oIdx, "name", e.target.value)}
                             />
                             <input 
                              type="number" 
                              step="0.01"
                              className="input-field !py-2 w-28 !bg-white" 
                              placeholder="Preço R$" 
                              value={opt.price}
                              onChange={e => updateOption(gIdx, oIdx, "price", e.target.value)}
                             />
                             <button type="button" onClick={() => {
                               const newGroups = [...productForm.optionGroups];
                               newGroups[gIdx].options.splice(oIdx, 1);
                               setProductForm({...productForm, optionGroups: newGroups});
                             }} className="text-gray-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                           </div>
                         ))}
                         <button type="button" onClick={() => addOptionToGroup(gIdx)} className="text-xs font-bold text-purple-500 hover:underline">+ Adicionar Opção</button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="flex gap-4 pt-8 sticky bottom-0 bg-white pb-2">
                 <button type="button" onClick={() => setProductModal(false)} className="btn-secondary flex-1">Cancelar</button>
                 <button type="submit" disabled={saving} className="btn-primary flex-1">
                   {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Produto"}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
