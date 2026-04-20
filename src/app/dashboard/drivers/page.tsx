"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Trash2, 
  Loader2, 
  Smartphone, 
  Bike,
  Navigation,
  CheckCircle2,
  TrendingUp,
  Search,
  UserPlus
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    vehicle: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drivers");
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar entregadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar");
      
      toast.success("Entregador cadastrado!");
      setFormData({ name: "", phone: "", vehicle: "" });
      setIsAdding(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este motoboy do sistema?")) return;
    try {
      await fetch(`/api/drivers?id=${id}`, { method: "DELETE" });
      toast.success("Removido!");
      fetchData();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
      <Header title="Gerente de Logística" />

      <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full space-y-10">
        
        {/* Topo Dinâmico */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
              <h2 className="text-2xl font-bold text-navy tracking-tight italic-none">Equipe de Entregas</h2>
              <p className="text-slate-400 text-sm mt-1 italic-none">Gerencie sua força de logística e acompanhe performance.</p>
           </div>
           <button 
             onClick={() => setIsAdding(!isAdding)}
             className="btn-primary flex items-center gap-2 !rounded-2xl shadow-xl shadow-orange-500/20"
           >
             {isAdding ? <Plus className="rotate-45" size={18}/> : <UserPlus size={18}/>}
             {isAdding ? "Cancelar" : "Cadastrar Motoboy"}
           </button>
        </div>

        {/* Cadastro Inline */}
        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] border border-orange-100 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                   <input className="input-field" placeholder="Ex: Roberto Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone/WhatsApp</label>
                   <input className="input-field" placeholder="55119..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Veículo / Placa</label>
                   <div className="relative">
                      <Bike className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input className="input-field pl-12" placeholder="Ex: Moto CG 160" value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})} />
                   </div>
                </div>
             </div>
             <button type="submit" className="w-full btn-primary !bg-navy mt-6 !py-4 hover:!bg-orange-500 rounded-xl">Registrar Entregador na Base</button>
          </form>
        )}

        {/* Listagem & Relatório */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
           <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 italic-none">
                 <TrendingUp size={20} className="text-orange-500" />
                 Relatório de Entregas
              </h3>
              <div className="relative w-full md:w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                 <input 
                   placeholder="Buscar por nome..." 
                   className="input-field !py-2.5 !text-xs !pl-10 !rounded-2xl bg-slate-50/50 border-none"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>

           {loading ? (
             <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="animate-spin text-orange-500 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escaneando logs...</p>
             </div>
           ) : (
             <div className="divide-y divide-slate-50">
               {filteredDrivers.length === 0 ? (
                 <div className="py-24 text-center opacity-30 italic-none">
                    <Navigation className="mx-auto mb-4" size={48} strokeWidth={1} />
                    <p className="text-sm font-medium">Nenhum motoboy ativo em sua frota.</p>
                 </div>
               ) : (
                 filteredDrivers.map(driver => (
                   <div key={driver.id} className="p-6 lg:p-10 flex flex-col sm:flex-row justify-between items-center gap-8 hover:bg-slate-50/50 transition-all group">
                      <div className="flex items-center gap-6 flex-1">
                         <div className="w-16 h-16 bg-navy text-white rounded-[24px] flex items-center justify-center text-xl font-black shadow-lg shadow-navy/10">
                            {driver.name.substring(0, 1).toUpperCase()}
                         </div>
                         <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2 italic-none">
                               {driver.name}
                               <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            </h4>
                            <div className="flex items-center gap-4">
                               <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium italic-none">
                                  <Smartphone size={14} /> {driver.phone || "---"}
                               </span>
                               <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium italic-none">
                                  <Bike size={14} /> {driver.vehicle || "---"}
                               </span>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-10">
                         <div className="text-center px-8 border-x border-slate-100">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Entregas Feitas</p>
                            <div className="flex items-center gap-2 justify-center">
                               <CheckCircle2 size={16} className="text-emerald-500" />
                               <span className="text-2xl font-black text-navy">{driver._count?.orders || 0}</span>
                            </div>
                         </div>

                         <button 
                           onClick={() => handleDelete(driver.id)}
                           className="p-4 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-[20px] transition-all"
                         >
                            <Trash2 size={22} />
                         </button>
                      </div>
                   </div>
                 ))
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
