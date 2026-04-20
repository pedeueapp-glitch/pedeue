"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { 
  Square,
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  LayoutGrid,
  CheckCircle2,
  XCircle,
  Hash
} from "lucide-react";
import toast from "react-hot-toast";

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({ number: "", capacity: "" });
  const [saving, setSaving] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/tables");
      const data = await res.json();
      setTables(data);
    } catch {
      toast.error("Erro ao carregar mesas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable.number) return toast.error("O número da mesa é obrigatório");
    
    setSaving(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTable,
          capacity: newTable.capacity ? parseInt(newTable.capacity) : null
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Mesa cadastrada!");
      setNewTable({ number: "", capacity: "" });
      setIsModalOpen(false);
      fetchTables();
    } catch {
      toast.error("Erro ao salvar mesa");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (table: any) => {
    try {
      const res = await fetch(`/api/tables/${table.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !table.isActive }),
      });
      if (!res.ok) throw new Error();
      fetchTables();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta mesa?")) return;
    try {
      const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Mesa excluída!");
      fetchTables();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <Header title="Gestão de Salão" />
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Mesas do Estabelecimento</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Configure o layout do seu atendimento presencial.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 flex items-center gap-2 transition-all shadow-lg shadow-slate-100"
            >
              <Plus size={16} className="text-orange-500" /> Adicionar Mesa
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loading ? (
               <div className="col-span-full py-20 flex flex-col items-center gap-4 text-slate-300">
                  <Loader2 className="animate-spin" size={32} />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em]">Sincronizando Salão...</span>
               </div>
            ) : tables.length === 0 ? (
               <div className="col-span-full py-20 bg-white rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-4 text-slate-300">
                  <LayoutGrid size={40} className="text-slate-100" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Nenhuma mesa encontrada</span>
               </div>
            ) : (
              tables.map((table) => (
                <div key={table.id} className={`group relative bg-white aspect-square rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 border-slate-200/60 hover:border-orange-500/50 hover:shadow-xl ${!table.isActive ? 'opacity-50 grayscale' : 'shadow-sm'}`}>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                     <button 
                        onClick={() => toggleActive(table)}
                        className={`p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm ${table.isActive ? 'text-green-500' : 'text-slate-300'}`}
                     >
                        {table.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                     </button>
                     <button 
                        onClick={() => handleDelete(table.id)}
                        className="p-1.5 rounded-lg bg-white border border-slate-100 text-red-400 hover:text-red-600 shadow-sm"
                     >
                        <Trash2 size={12} />
                     </button>
                  </div>
                  
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black transition-all ${table.isActive ? 'bg-orange-500 text-white animate-in zoom-in-50' : 'bg-slate-100 text-slate-300'}`}>
                    <span className="text-lg tracking-tighter">{table.number}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mesa</span>
                  {table.capacity && (
                     <span className="text-[8px] font-bold text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded uppercase mt-1">Cap. {table.capacity}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Moderno */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border border-slate-100">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
               <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <Square size={14} className="text-orange-500" /> Nova Mesa
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-all"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação (Número/Nome)</label>
                  <div className="relative">
                     <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                     <input 
                       type="text" 
                       value={newTable.number}
                       onChange={(e) => setNewTable({...newTable, number: e.target.value})}
                       placeholder="Ex: 01, A2..."
                       className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-slate-700 outline-none focus:border-orange-500"
                       required
                     />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacidade (Pessoas)</label>
                  <input 
                    type="number" 
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({...newTable, capacity: e.target.value})}
                    placeholder="Ex: 4"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-slate-700 outline-none focus:border-orange-500"
                  />
               </div>
               <button 
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-orange-500 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                 {saving ? "Registrando..." : "Registrar Mesa"}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
