"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Edit3, Trash2, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  emoji?: string;
  _count?: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", emoji: "" });

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/store");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Categoria salva!");
      setModalOpen(false);
      loadData();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deletar categoria e todos os seus produtos?")) return;
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      toast.success("Categoria removida");
      loadData();
    } catch {
      toast.error("Erro ao remover");
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Categorias</h2>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setForm({ name: "", emoji: "" });
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="text-3xl">{cat.emoji || "📦"}</div>
            <div className="flex-1">
              <div className="font-bold text-gray-800">{cat.name}</div>
              <div className="text-sm text-gray-400">Produtos cadastrados</div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setEditingCategory(cat);
                  setForm({ name: cat.name, emoji: cat.emoji || "" });
                  setModalOpen(true);
                }} 
                className="text-gray-400 hover:text-purple-500 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-xl font-bold mb-6">{editingCategory ? "Editar Categoria" : "Nova Categoria"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" className="input-field" placeholder="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <input type="text" className="input-field" placeholder="Emoji (opcional)" value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
