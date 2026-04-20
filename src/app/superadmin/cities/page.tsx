"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  MapPin, 
  Trash2,
  Search,
  Loader2,
  Map,
  Globe,
  Building2,
  Check
} from "lucide-react";
import toast from "react-hot-toast";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default function SuperAdminCitiesPage() {
  const [platformCities, setPlatformCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modais e Estados de Busca Externa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [externalCities, setExternalCities] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [cep, setCep] = useState("");
  const [searchingCep, setSearchingCep] = useState(false);

  const fetchPlatformCities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/cities");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlatformCities(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformCities();
    // Pre-load states
    fetch("https://brasilapi.com.br/api/ibge/uf/v1")
      .then(r => r.json())
      .then(setStates)
      .catch(() => toast.error("Erro ao carregar estados do Brasil"));
  }, []);

  useEffect(() => {
    if (selectedState) {
       setLoadingExternal(true);
       fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${selectedState}?providers=dados-abertos-br,gov,wikipedia`)
         .then(r => r.json())
         .then(setExternalCities)
         .finally(() => setLoadingExternal(false));
    } else {
       setExternalCities([]);
    }
  }, [selectedState]);

  const handleSearchCep = async () => {
    if (cep.length < 8) return;
    setSearchingCep(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
      const data = await res.json();
      if (!res.ok) throw new Error("CEP não encontrado");
      
      const confirmAdd = confirm(`Deseja adicionar ${data.city} - ${data.state} à plataforma?`);
      if (confirmAdd) {
         addCity(data.city, data.state);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSearchingCep(false);
    }
  };

  const addCity = async (name: string, state: string) => {
    try {
      const res = await fetch("/api/superadmin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, state }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(`${name} adicionada com sucesso!`);
      fetchPlatformCities();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleCityStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/superadmin/cities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");
      fetchPlatformCities();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteCity = async (id: string) => {
    if (!confirm("Remover esta cidade? Lojas desta região podem ser afetadas.")) return;
    try {
      const res = await fetch(`/api/superadmin/cities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Cidade removida");
      fetchPlatformCities();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredCities = platformCities.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar mode="SUPERADMIN" />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header title="Cidades Operacionais" />

        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Filtrar cidades ativas..."
                className="input-field !pl-12 !h-14 !rounded-3xl"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-4 w-full md:w-auto">
               <div className="relative flex-1 md:w-48">
                  <input 
                    type="text"
                    placeholder="Busca por CEP..."
                    className="input-field !h-14 !rounded-3xl !pr-16"
                    maxLength={8}
                    value={cep}
                    onChange={e => setCep(e.target.value.replace(/\D/g, ''))}
                  />
                  <button 
                    onClick={handleSearchCep}
                    disabled={searchingCep || cep.length < 8}
                    className="absolute right-2 top-2 bottom-2 px-3 bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-500 rounded-2xl transition-all disabled:opacity-50"
                  >
                    {searchingCep ? <Loader2 className="animate-spin" size={16} /> : <MapPin size={18} />}
                  </button>
               </div>

               <button 
                onClick={() => setIsModalOpen(true)}
                className="btn-primary !px-8 flex items-center gap-3 !h-14 !rounded-3xl shadow-xl shadow-orange-500/20"
               >
                <Plus size={20} /> Nova Cidade
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Lista de Cidades Ativas */}
             <div className="lg:col-span-2">
                {loading ? (
                  <div className="bg-white rounded-[40px] p-20 flex flex-col items-center justify-center border border-slate-100 opacity-30">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
                    <p className="font-black uppercase tracking-widest text-[10px]">Mapeando regiões...</p>
                  </div>
                ) : filteredCities.length === 0 ? (
                  <div className="bg-white rounded-[40px] p-20 flex flex-col items-center justify-center border border-slate-100 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center text-slate-300 mb-6">
                       <Map size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase italic-none">Nenhuma Cidade Operacional</h3>
                    <p className="text-slate-400 text-sm mt-2 max-w-xs font-bold">Adicione cidades para permitir que lojistas se cadastrem nessas regiões.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCities.map(city => (
                      <div key={city.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${city.isActive ? "bg-orange-50 text-orange-500" : "bg-slate-50 text-slate-300"}`}>
                               <Building2 size={24} />
                            </div>
                            <div>
                               <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight">{city.name}</h4>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{city.state}</p>
                            </div>
                         </div>

                         <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => toggleCityStatus(city.id, city.isActive)}
                              className={`p-2 rounded-xl border transition-all ${city.isActive ? "bg-green-50 border-green-100 text-green-600" : "bg-slate-50 border-slate-100 text-slate-400"}`}
                              title={city.isActive ? "Desativar" : "Ativar"}
                            >
                               <Check size={16} />
                            </button>
                            <button 
                              onClick={() => deleteCity(city.id)}
                              className="p-2 bg-red-50 border border-red-100 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             {/* Sidebar Info Card */}
             <div className="space-y-6">
                <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
                   <div className="relative z-10">
                      <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                         <Globe size={24} />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">Expansão de Mercado</h3>
                      <p className="text-slate-400 text-xs font-bold leading-relaxed mb-8">
                        Gerencie as cidades onde sua plataforma de delivery está autorizada a operar.
                      </p>
                      
                      <div className="space-y-4">
                         <div className="flex items-center gap-4">
                            <div className="text-2xl font-black text-orange-500">{platformCities.length}</div>
                            <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Cidades Ativas</div>
                         </div>
                      </div>
                   </div>
                   <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
                </div>

                <div className="bg-white rounded-[40px] p-8 border border-slate-100">
                   <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Dica de Gestão</h4>
                   <p className="text-slate-600 text-xs font-bold leading-relaxed italic-none">
                     Use a busca por CEP para adicionar cidades instantaneamente com alta precisão de dados.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* MODAL: ADICIONAR CIDADE (IBGE) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] w-full max-w-2xl p-10 lg:p-14 shadow-2xl flex flex-col max-h-[90vh]">
             <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Expandir Região</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Busca oficial via IBGE</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 text-slate-400 rounded-3xl hover:bg-slate-100 transition-all">
                   <Plus className="rotate-45" size={24} />
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-1 space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado (UF)</label>
                   <select 
                    className="input-field appearance-none"
                    value={selectedState}
                    onChange={e => setSelectedState(e.target.value)}
                   >
                     <option value="">Selecionar...</option>
                     {states.map(s => (
                       <option key={s.id} value={s.sigla}>{s.nome} ({s.sigla})</option>
                     ))}
                   </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade Disponível</label>
                   <div className="relative">
                      <select 
                        className="input-field appearance-none disabled:opacity-30"
                        disabled={!selectedState || loadingExternal}
                        onChange={e => {
                           if (e.target.value) {
                             addCity(e.target.value, selectedState);
                             setIsModalOpen(false);
                           }
                        }}
                      >
                        <option value="">{loadingExternal ? "Carregando..." : "Escolha a cidade para ativar..."}</option>
                        {externalCities.map((c, idx) => (
                          <option key={`${c.nome}-${idx}`} value={c.nome}>{c.nome}</option>
                        ))}
                      </select>
                      {loadingExternal && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                           <Loader2 className="animate-spin text-orange-500" size={16} />
                        </div>
                      )}
                   </div>
                </div>
             </div>

             <div className="mt-auto p-6 bg-orange-50 rounded-[32px] border border-orange-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm font-black">?</div>
                <p className="text-[11px] text-orange-900 font-bold leading-tight">
                  Ao ativar uma cidade, o sistema passará a aceitar cadastros de lojistas, entregadores e pedidos para esta região geográfica.
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
