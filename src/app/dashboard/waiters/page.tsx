"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { 
  User, 
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  UserPlus,
  CheckCircle2,
  XCircle
} from "lucide-react";
import toast from "react-hot-toast";

export default function WaitersPage() {
  const [waiters, setWaiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWaiter, setNewWaiter] = useState({ name: "", phone: "", isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchWaiters = async () => {
    try {
      const res = await fetch("/api/waiters");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Falha ao carregar");
      }
      const data = await res.json();
      setWaiters(data);
    } catch (err: any) {
      console.error("DEBUG WAITERS FETCH:", err);
      toast.error(err.message || "Erro ao carregar garçons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaiters();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaiter.name) return toast.error("O nome é obrigatório");
    
    setSaving(true);
    try {
      const res = await fetch("/api/waiters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWaiter),
      });
      if (!res.ok) throw new Error();
      toast.success("Garçom cadastrado!");
      setNewWaiter({ name: "", phone: "", isActive: true });
      setIsModalOpen(false);
      fetchWaiters();
    } catch {
      toast.error("Erro ao salvar garçom");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (waiter: any) => {
    try {
      const res = await fetch(`/api/waiters/${waiter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !waiter.isActive }),
      });
      if (!res.ok) throw new Error();
      fetchWaiters();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este garçom?")) return;
    try {
      const res = await fetch(`/api/waiters/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Excluído!");
      fetchWaiters();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header title="Equipe de Garçons" />
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Gerenciar Garçons</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Sua equipe de salão ativa no sistema.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:brightness-110 flex items-center gap-2 transition-all"
            >
              <UserPlus size={16} /> Novo Garçom
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
               <div className="col-span-full py-20 flex flex-col items-center gap-4 text-slate-300">
                  <Loader2 className="animate-spin" size={32} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Carregando Equipe...</span>
               </div>
            ) : waiters.length === 0 ? (
               <div className="col-span-full py-20 bg-white rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-4 text-slate-300">
                  <User size={40} className="text-slate-100" />
                  <span className="text-xs font-black uppercase">Nenhum garçom cadastrado</span>
               </div>
            ) : (
              waiters.map((waiter) => (
                <div key={waiter.id} className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${waiter.isActive ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-300'}`}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">{waiter.name}</h3>
                      <p className="text-slate-400 text-[10px] font-bold">{waiter.phone || "Sem telefone"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleActive(waiter)}
                      className={`p-2 rounded-lg transition-all ${waiter.isActive ? 'text-green-500 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-50'}`}
                    >
                      {waiter.isActive ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </button>
                    <button 
                      onClick={() => handleDelete(waiter.id)}
                      className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Cadastrar Novo Garçom</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Garçom</label>
                  <input 
                    type="text" 
                    value={newWaiter.name}
                    onChange={(e) => setNewWaiter({...newWaiter, name: e.target.value})}
                    placeholder="Ex: João da Silva"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-1 focus:ring-orange-500 outline-none"
                    required
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone (Opcional)</label>
                  <input 
                    type="text" 
                    value={newWaiter.phone}
                    onChange={(e) => setNewWaiter({...newWaiter, phone: e.target.value})}
                    placeholder="(00) 00000-0000"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
               </div>
               <button 
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-orange-500 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
               >
                 {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                 {saving ? "Salvando..." : "Finalizar Cadastro"}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
