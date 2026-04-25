"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Loader2,
  GripVertical,
  Smile,
  X,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [storeType, setStoreType] = useState("RESTAURANT");

  const RESTAURANT_EMOJIS = [
    "🍔", "🍕", "🌭", "🍟", "🥗", "🍣", "🥟", "🍗", "🥣", "🍧",
    "🍦", "🍩", "🍪", "🥤", "☕", "🍺", "🍷", "🥩", "🥪", "🍳",
    "🥘", "🍱", "🥐", "🥨", "🍫", "🍓", "🍍", "🥑", "🥕", "🌶️",
    "🥦", "🌽"
  ];

  const SHOWCASE_EMOJIS = [
    "👕", "👗", "👠", "👜", "🕶️", "⌚", "💍", "👒", "🧥", "👖",
    "👔", "👙", "👞", "👢", "👛", "💎", "🧶", "💄", "🧴", "🌂",
    "🎁", "🎀", "🧸", "🎒", "🧳", "👟", "🧢", "🔥", "✨", "🌟"
  ];

  const SERVICE_EMOJIS = [
    "📄", "🛠️", "🎨", "🖊️", "📷", "🎹", "🎓", "✂️", "🧺", "📦",
    "🧹", "📐", "🖥️", "📠", "🔧", "🔩", "🧱", "🏮", "📜", "📂",
    "📅", "📌", "⚖️", "💳", "💰", "✉️", "📫", "📱", "🔨", "🪚"
  ];

  const getEmojiList = () => {
    if (storeType === "SHOWCASE") return SHOWCASE_EMOJIS;
    if (storeType === "SERVICE") return SERVICE_EMOJIS;
    return RESTAURANT_EMOJIS;
  };

  const EMOJI_LIST = getEmojiList();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, storeRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/store")
      ]);
      const data = await catRes.json();
      const storeData = await storeRes.json();
      setCategories(Array.isArray(data) ? data : []);
      setStoreType(storeData?.storeType || "RESTAURANT");
    } catch {
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    
    const categoriesWithNewOrder = newCategories.map((cat, idx) => ({
       ...cat,
       position: idx
    }));

    setCategories(categoriesWithNewOrder);

    try {
      await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: categoriesWithNewOrder.map(c => ({ id: c.id, position: c.position })) })
      });
      toast.success("Ordem atualizada");
    } catch {
      toast.error("Erro ao salvar ordem");
    }
 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCategory ? "PATCH" : "POST";
    const url = editingCategory ? "/api/categories" : "/api/categories";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            id: editingCategory?.id,
            name, 
            emoji: emoji 
        }),
      });

      if (!res.ok) throw new Error();
      
      toast.success("Categoria salva!");
      setIsModalOpen(false);
      setName("");
      setEmoji("");
      setEditingCategory(null);
      fetchData();
    } catch {
      toast.error("Erro ao salvar categoria");
    }
  };

  const handleDelete = async (id: string) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      const res = await fetch(`/api/categories?id=${categoryToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Categoria excluída");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title={storeType === "SHOWCASE" ? "Categorias da Vitrine" : storeType === "SERVICE" ? "Categorias de Serviços" : "Categorias do Cardápio"} />

      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                {storeType === "SHOWCASE" ? "Organize sua Vitrine" : storeType === "SERVICE" ? "Organize seus Serviços" : "Organize seu Menu"}
            </h2>
            <p className="text-gray-400 text-sm">
                {storeType === "SHOWCASE" ? "Crie seções como 'Vestidos', 'Acessórios' ou 'Sale'." : storeType === "SERVICE" ? "Crie seções como 'Impressões', 'Criação' ou 'Materiais'." : "Crie seções como 'Hambúrgueres', 'Bebidas' ou 'Sobremesas'."}
            </p>
          </div>
          <button 
            onClick={() => {
              setEditingCategory(null);
              setName("");
              setEmoji("");
              setIsModalOpen(true);
            }}
            className="btn-primary shadow-brand"
          >
            <Plus className="w-5 h-5" />
            Nova Categoria
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 font-bold">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
            Carregando categorias...
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={category.id} className="bg-white p-5 rounded-3xl shadow-card border border-gray-50 flex items-center justify-between group hover:border-purple-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 text-gray-200 flex items-center justify-center">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-2xl">
                    {category.emoji || "🍔"}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800">{category.name}</h3>
                    <p className="text-[10px] font-black  tracking-widest text-gray-400">
                      {category._count?.products || 0} PRODUTOS
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Ordenação */}
                  <div className="flex flex-col gap-1 pr-6 border-r border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => moveCategory(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-300 hover:text-navy disabled:opacity-30"
                    >
                        <ChevronUp size={14} />
                    </button>
                    <button 
                        onClick={() => moveCategory(index, 'down')}
                        disabled={index === categories.length - 1}
                        className="p-1 text-slate-300 hover:text-navy disabled:opacity-30"
                    >
                        <ChevronDown size={14} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            setEditingCategory(category);
                            setName(category.name);
                            setEmoji(category.emoji || "");
                            setIsModalOpen(true);
                        }}
                        className="p-3 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-xl transition-all"
                    >
                        <Edit3 size={20} />
                    </button>
                    <button 
                        onClick={() => handleDelete(category.id)}
                        className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Categoria?"
        message="Isso pode afetar os produtos vinculados. Tem certeza que deseja remover esta categoria permanentemente?"
        confirmText="Excluir Categoria"
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl animate-scale-up">
            <h2 className="text-3xl font-black mb-2 text-gray-800 italic-none">{editingCategory ? "Editar" : "Nova"} Categoria</h2>
            <p className="text-gray-400 text-sm mb-8 font-medium italic-none">Configure a seção do seu cardápio.</p>
            
            <div className="space-y-6 mb-10">
              <div className="flex gap-4">
                <div className="space-y-2 relative">
                   <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Ícone</label>
                   <div className="relative">
                      <button 
                         type="button"
                         onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                         className="input-field flex items-center justify-between !cursor-pointer hover:bg-slate-50 transition-colors w-24"
                      >
                         <span className="text-xl">{emoji || "---"}</span>
                         <Smile size={18} className="text-slate-300" />
                      </button>

                      {showEmojiPicker && (
                         <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 w-64">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                               <span className="text-[9px] font-black  text-slate-400 tracking-widest">Escolha um ícone</span>
                               <button type="button" onClick={() => setShowEmojiPicker(false)} className="text-slate-300 hover:text-slate-600">
                                  <X size={14} />
                               </button>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                               {EMOJI_LIST.map(e => (
                                 <button
                                   key={e}
                                   type="button"
                                   onClick={() => {
                                      setEmoji(e);
                                      setShowEmojiPicker(false);
                                   }}
                                   className="text-xl p-2 hover:bg-purple-50 rounded-xl transition-all hover:scale-110 active:scale-90"
                                 >
                                    {e}
                                 </button>
                               ))}
                            </div>
                         </div>
                      )}
                   </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-black  tracking-widest text-gray-400 mb-2 ml-4">Nome</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Pizzas"
                    className="input-field !bg-gray-50 border-none shadow-inner" 
                    required 
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1 shadow-sm">Cancelar</button>
              <button type="submit" className="btn-primary flex-1 shadow-brand">Salvar</button>
            </div>
          </form>
        </div>
      )}
      
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Categoria?"
        message="Isso pode afetar os produtos vinculados. Tem certeza que deseja remover esta categoria permanentemente?"
        confirmText="Excluir Categoria"
      />
    </div>
  );
}
