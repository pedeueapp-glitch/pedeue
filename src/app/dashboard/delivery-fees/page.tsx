"use client";

import { useState, useEffect } from "react";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Loader2, 
  Search, 
  DollarSign,
  Navigation,
  MapPinned
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";

export default function DeliveryFeesPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    neighborhood: "",
    fee: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/delivery-fees");
      const data = await res.json();
      setAreas(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar taxas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.neighborhood || !formData.fee) return;

    try {
      const res = await fetch("/api/delivery-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro desconhecido");
      }
      
      toast.success("Área adicionada!");
      setFormData({ neighborhood: "", fee: "" });
      setIsAdding(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar taxa");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta taxa de entrega?")) return;

    try {
      await fetch(`/api/delivery-fees?id=${id}`, { method: "DELETE" });
      toast.success("Removido com sucesso");
      fetchData();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const filteredAreas = areas.filter(a => 
    a.neighborhood.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
      <Header title="Taxas de Entrega / Bairros" />

      <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full space-y-10">
        
        {/* Cabeçalho de Ação */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
              <h2 className="text-2xl font-bold text-navy tracking-tight">Logística de Entrega</h2>
              <p className="text-slate-400 text-sm mt-1">Defina o preço do frete para cada região que você atende.</p>
           </div>
           <button 
             onClick={() => setIsAdding(!isAdding)}
             className="btn-primary !rounded-2xl flex items-center gap-2"
           >
             {isAdding ? <Loader2 className="rotate-45" size={18}/> : <Plus size={18}/>}
             {isAdding ? "Cancelar" : "Nova Taxa"}
           </button>
        </div>

        {/* Formulário de Adição */}
        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] border border-orange-100 shadow-xl shadow-orange-500/5 animate-in slide-in-from-top-4 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Bairro / Região</label>
                   <input 
                      placeholder="Ex: Centro, Barra da Tijuca..." 
                      className="input-field"
                      value={formData.neighborhood}
                      onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                      required
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Valor da Taxa (R$)</label>
                   <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        className="input-field pl-10"
                        value={formData.fee}
                        onChange={e => setFormData({...formData, fee: e.target.value})}
                        required
                      />
                   </div>
                </div>
                <button type="submit" className="btn-primary !h-[48px] !rounded-xl !bg-navy hover:!bg-orange-500">
                   Salvar Configuração
                </button>
             </div>
          </form>
        )}

        {/* Listagem */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
           <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                    <MapPinned size={20} />
                 </div>
                 <h3 className="font-bold text-slate-800">Regiões Cadastradas</h3>
              </div>
              <div className="relative w-full md:w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                 <input 
                   placeholder="Procurar bairro..." 
                   className="input-field !py-2 !text-xs !pl-10 !rounded-xl bg-slate-50/50 border-none"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>

           {loading ? (
             <div className="flex flex-col items-center justify-center p-20 opacity-30">
                <Loader2 className="animate-spin mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Carregando Logística...</p>
             </div>
           ) : (
             <div className="divide-y divide-slate-50">
                {filteredAreas.length === 0 ? (
                  <div className="p-20 text-center space-y-4 opacity-40">
                     <Navigation size={48} className="mx-auto text-slate-200" strokeWidth={1} />
                     <p className="text-sm font-medium text-slate-500 italic-none">Nenhum bairro cadastrado ainda.</p>
                  </div>
                ) : (
                  filteredAreas.map((area) => (
                    <div key={area.id} className="p-6 lg:px-8 flex justify-between items-center hover:bg-slate-50/80 transition-all group">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                             <MapPin size={22} />
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-900 capitalize">{area.neighborhood}</h4>
                             <p className="text-[11px] text-slate-400 font-medium">Bairro Atendido</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-10">
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Taxa de Frete</p>
                             <span className="text-lg font-black text-navy">R$ {area.fee.toFixed(2)}</span>
                          </div>
                          <button 
                            onClick={() => handleDelete(area.id)}
                            className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={20} />
                          </button>
                       </div>
                    </div>
                  ))
                )}
             </div>
           )}
        </div>

        <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 flex items-start gap-4">
           <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <PlusCircle size={20} className="inline rotate-45" />
           </div>
           <div>
              <h5 className="font-bold text-orange-800 text-sm italic-none">Atenção!</h5>
              <p className="text-xs text-orange-700/70 mt-1 font-medium italic-none">
                 Caso o cliente escolha um bairro que não esteja nesta lista no checkout, o sistema usará a **taxa padrão** definida nas configurações da loja.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}

import { PlusCircle } from "lucide-react";
