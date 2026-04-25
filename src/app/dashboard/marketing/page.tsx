"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  Zap, 
  Map, 
  UserPlus, 
  ChevronRight, 
  MessageCircle, 
  Star, 
  Clock,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  Pencil,
  CheckCircle,
  AlertCircle
} from "lucide-react";

import { format } from "date-fns";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState("heatmap");
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [automationData, setAutomationData] = useState<any>(null);
  const [upsellRules, setUpsellRules] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [storeSlug, setStoreSlug] = useState("");

  // Form States
  const [isAddingAffiliate, setIsAddingAffiliate] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<any>(null);
  const [isAddingUpsell, setIsAddingUpsell] = useState(false);



  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      // Buscar Slug da Loja
      const resStore = await fetch("/api/store");
      const dataStore = await resStore.json();
      setStoreSlug(dataStore.slug);

      if (activeTab === "heatmap") {

        const res = await fetch("/api/marketing/heatmap");
        const data = await res.json();
        setHeatmapData(data);
      } else if (activeTab === "affiliates") {
        const res = await fetch("/api/marketing/affiliates");
        const data = await res.json();
        setAffiliates(data);
      } else if (activeTab === "automation") {
        const res = await fetch("/api/marketing/automation");
        const data = await res.json();
        setAutomationData(data);
      } else if (activeTab === "upsell") {
        const res = await fetch("/api/marketing/upsell");
        const data = await res.json();
        setUpsellRules(data);
        
        // Buscar produtos para o form de upsell
        const resP = await fetch("/api/products");
        const dataP = await resP.json();
        setProducts(dataP);
      }
    } catch (e) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <Header title="Marketing e Crescimento" />

      <main className="flex-1 p-4 md:p-8 space-y-8">
        
        {/* NAVEGAÇÃO DE TABS */}
        <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm w-fit">
           {[
             { id: "heatmap", label: "Horários", icon: Clock },
             { id: "affiliates", label: "Influenciadores", icon: UserPlus },
             { id: "automation", label: "Automação", icon: Zap },
             { id: "upsell", label: "Upsell", icon: ArrowUpRight },
             { id: "segmentation", label: "Fidelidade", icon: Star },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-black  tracking-widest transition-all ${activeTab === tab.id ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'text-slate-400 hover:bg-slate-50'}`}
             >
               <tab.icon size={14} /> {tab.label}
             </button>
           ))}
        </div>


        {/* CONTEÚDO DINÂMICO */}
        {activeTab === "heatmap" && heatmapData && (
           <div className="animate-in fade-in duration-500 space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900  tracking-tighter mb-6 flex items-center gap-3">
                       <Map className="text-purple-500" size={20} /> Mapa de Calor
                    </h3>

                    <div className="overflow-x-auto pb-4">
                       <div className="min-w-[600px]">
                          <div className="flex mb-4">
                             <div className="w-16 h-8" />
                             {Array.from({length: 24}).map((_, i) => (
                               <div key={i} className="flex-1 text-center text-[10px] font-bold text-slate-400">{i}h</div>
                             ))}
                          </div>
                          {daysOfWeek.map((day, dIdx) => (
                             <div key={day} className="flex items-center gap-1 mb-1">
                                <div className="w-16 text-[10px] font-black text-slate-500 ">{day}</div>
                                {heatmapData.heatmap[dIdx].map((val: number, hIdx: number) => {
                                   const max = Math.max(...heatmapData.heatmap.flat());
                                   const opacity = max > 0 ? (val / max) : 0;
                                   return (
                                     <div 
                                       key={hIdx} 
                                       title={`${val} pedidos`}
                                       className="flex-1 h-10 rounded-sm transition-all"
                                       style={{ 
                                         backgroundColor: val > 0 ? `rgba(139, 92, 246, ${0.1 + (opacity * 0.9)})` : '#f1f5f9',
                                         border: val > 0 ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid transparent'
                                       }}
                                     />
                                   );
                                })}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="bg-purple-500 p-8 rounded-3xl text-white shadow-xl shadow-purple-500/20">
                       <Clock size={24} className="mb-4 opacity-50" />
                       <h4 className="text-[10px] font-black  tracking-widest opacity-80 mb-1">Melhor Horário</h4>
                       <p className="text-3xl font-black">{heatmapData.hourlyPeak.indexOf(Math.max(...heatmapData.hourlyPeak))}h:00</p>
                       <p className="text-[9px] font-bold mt-3 opacity-70 italic">Últimos 30 dias.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                       <h4 className="text-[9px] font-black text-slate-400  tracking-widest mb-4">Dica de Marketing</h4>
                       <p className="text-xs font-bold text-slate-600 leading-relaxed">
                          Seu pico é às <span className="text-purple-500">{heatmapData.hourlyPeak.indexOf(Math.max(...heatmapData.hourlyPeak))}h</span>. 
                          Crie uma **Oferta** às {heatmapData.hourlyPeak.indexOf(Math.max(...heatmapData.hourlyPeak)) - 1}h!
                       </p>
                    </div>
                 </div>

              </div>
           </div>
        )}

         {activeTab === "affiliates" && (
           <div className="animate-in fade-in duration-500 space-y-8">
              <div className="flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900  tracking-tighter">Influenciadores</h3>
                    <p className="text-slate-500 font-bold text-[10px]  tracking-widest mt-1">Transforme parceiros em máquinas de vendas</p>
                 </div>
                 <button 
                   onClick={() => setIsAddingAffiliate(true)}
                   className="bg-slate-900 text-white px-6 py-3.5 rounded-xl font-black text-[10px]  tracking-widest hover:bg-purple-500 transition-all flex items-center gap-2"
                 >
                    <Plus size={16} /> Novo Parceiro
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                 {affiliates.map(aff => (
                    <div key={aff.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -mr-10 -mt-10 transition-all group-hover:scale-150" />
                       <div className="flex items-center justify-between mb-5 relative">
                          <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100 rounded-xl">
                             <UserPlus size={18} />
                          </div>
                          <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setEditingAffiliate(aff)}
                                className="p-2 bg-slate-50 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                title="Editar Influenciador"
                              >
                                 <Pencil size={14} />
                              </button>
                              <span className="text-[9px] font-black text-purple-500 bg-purple-50 px-3 py-1 rounded-full  tracking-widest">{aff.code}</span>
                           </div>
                       </div>
                       <h4 className="text-base font-black text-slate-900  mb-1">{aff.name}</h4>
                       <div className="flex items-center gap-2 mb-5">
                          <span className="text-[9px] font-black text-slate-400  tracking-widest">Comissão: {aff.commission}%</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[9px] font-black text-slate-400  tracking-widest">Desde: {aff.lastResetAt ? format(new Date(aff.lastResetAt), "dd/MM") : '--/--'}</span>
                       </div>

                       <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                             <p className="text-[8px] font-black text-slate-400  tracking-widest">Receita</p>
                             <p className="text-xs font-black text-slate-900">R$ {aff.revenue?.toFixed(2)}</p>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-slate-400  tracking-widest text-right">Comissão</p>
                             <p className="text-xs font-black text-purple-600 text-right">R$ {aff.commissionValue?.toFixed(2)}</p>
                          </div>
                       </div>

                       
                       <div className="space-y-2 mb-5">
                          <button 
                            onClick={() => {
                              const url = `${window.location.protocol}//${window.location.host}/${storeSlug}?ref=${aff.code}`;
                              navigator.clipboard.writeText(url);
                              toast.success("Link do influenciador copiado!");
                            }}
                            className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-[9px] font-black  tracking-widest flex items-center justify-center gap-2 hover:bg-purple-500 transition-all shadow-md"
                          >
                             <ArrowUpRight size={14} /> Link de Divulgação
                          </button>

                          <button 
                            onClick={async () => {
                              if(confirm(`Deseja marcar como pago R$ ${aff.commissionValue.toFixed(2)} para ${aff.name}? O contador de receita será zerado.`)) {
                                await fetch(`/api/marketing/affiliates`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ id: aff.id, reset: true })
                                });
                                fetchData();
                                toast.success("Pagamento registrado!");
                              }
                            }}
                            disabled={aff.commissionValue <= 0}
                            className="w-full py-2 bg-green-50 text-green-600 border border-green-100 rounded-lg text-[9px] font-black  tracking-widest hover:bg-green-600 hover:text-white transition-all disabled:opacity-30 disabled:grayscale"
                          >
                             Pagar e Zerar
                          </button>
                       </div>

                       <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                          <div>
                             <p className="text-lg font-black text-slate-900">{aff.totalOrdersCount}</p>
                             <p className="text-[8px] font-black text-slate-400  tracking-widest">Total Histórico</p>
                          </div>

                          <button 
                            onClick={async () => {
                              if(confirm("Excluir parceiro?")) {
                                await fetch(`/api/marketing/affiliates?id=${aff.id}`, { method: 'DELETE' });
                                fetchData();
                              }
                            }}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                             <Trash2 size={14} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
         )}


        {activeTab === "automation" && automationData && (
           <div className="animate-in fade-in duration-500 space-y-10">
              <div className="flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900  tracking-tighter">Re-engajamento</h3>
                    <p className="text-slate-500 font-bold text-[10px]  tracking-widest mt-1">Recupere clientes inativos</p>
                 </div>
                 <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl font-black text-[9px]  tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} /> {automationData.reEngagement.length} Em Risco
                 </div>
              </div>


              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black  text-slate-400">
                       <tr>
                          <th className="p-5">Cliente</th>
                          <th className="p-5 text-center">Nível</th>
                          <th className="p-5 text-center">Último Pedido</th>
                          <th className="p-5 text-right">Ação</th>
                       </tr>

                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {automationData.reEngagement.map((client: any) => (
                          <tr key={client.id} className="text-xs font-bold hover:bg-slate-50 transition-all">
                             <td className="p-5">
                                <p className="text-slate-900 ">{client.name}</p>
                                <p className="text-slate-400 font-medium">{client.phone}</p>
                             </td>
                             <td className="p-5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black  ${client.level === 'VIP' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>{client.level}</span>
                             </td>
                             <td className="p-5 text-center text-slate-500">
                                {client.daysSinceLastOrder} dias
                             </td>
                             <td className="p-5 text-right">
                                <a 
                                  href={`https://wa.me/55${client.phone.replace(/\D/g, '')}?text=Olá ${client.name}! Notamos que você sumiu. Que tal um cupom de 15% para hoje?`}
                                  target="_blank"
                                  className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl hover:bg-green-600 hover:text-white transition-all font-black  text-[9px] tracking-widest"
                                >
                                   <MessageCircle size={14} /> Chamar
                                </a>
                             </td>

                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === "upsell" && (
           <div className="animate-in fade-in duration-500 space-y-10">
              <div className="flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900  tracking-tighter">Smart Upsell</h3>
                    <p className="text-slate-500 font-bold text-[10px]  tracking-widest mt-1">Sugerir produtos complementares</p>
                 </div>
                 <button 
                   onClick={() => setIsAddingUpsell(true)}
                   className="bg-purple-500 text-white px-6 py-3.5 rounded-xl font-black text-[10px]  tracking-widest shadow-xl shadow-purple-500/20 hover:bg-purple-600 transition-all flex items-center gap-2"
                 >
                    <Plus size={16} /> Nova Regra
                 </button>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 {upsellRules.map(rule => (
                    <div key={rule.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-slate-300 rounded-xl group-hover:bg-purple-50 group-hover:text-purple-500 transition-all">
                             <Zap size={20} />
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400  tracking-widest mb-1">Se comprar <span className="text-slate-900">{rule.triggerProductName}</span></p>
                             <p className="text-sm font-black text-slate-900 ">Sugerir: {rule.suggestProductName}</p>
                             <div className="flex items-center gap-3 mt-1.5">
                                {rule.discountPrice && <p className="text-[10px] font-bold text-green-500 ">Por R$ {rule.discountPrice.toFixed(2)}</p>}
                                <span className="text-[8px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded  tracking-tighter">{rule.timesAccepted} Conversões</span>
                             </div>
                          </div>

                       </div>
                       <button 
                        onClick={async () => {
                          if(confirm("Remover regra?")) {
                            await fetch(`/api/marketing/upsell?id=${rule.id}`, { method: 'DELETE' });
                            fetchData();
                          }
                        }}
                        className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                 ))}
              </div>

           </div>
        )}

        {activeTab === "segmentation" && automationData && (
           <div className="animate-in fade-in duration-500 space-y-10">
              <h3 className="text-3xl font-black text-slate-900  tracking-tighter">Nível de Fidelidade dos Clientes</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                 {[
                   { label: "VIP", count: automationData.segmentation.filter((c: any) => c.level === 'VIP').length, color: "purple", desc: "Muito frequentes" },
                   { label: "Frequentes", count: automationData.segmentation.filter((c: any) => c.level === 'FREQUENTE').length, color: "blue", desc: "Compram regularmente" },
                   { label: "Inativos", count: automationData.segmentation.filter((c: any) => c.level === 'INATIVO').length, color: "slate", desc: "Há mais de 30 dias" },
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4" style={{ borderTopColor: stat.color === 'purple' ? '#a855f7' : stat.color === 'blue' ? '#3b82f6' : '#94a3b8' }}>
                      <p className="text-[9px] font-black text-slate-400  tracking-widest mb-1">{stat.label}</p>
                      <h4 className="text-3xl font-black text-slate-900">{stat.count}</h4>
                      <p className="text-[8px] font-bold text-slate-400  mt-3">{stat.desc}</p>
                   </div>
                 ))}
              </div>


              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black  text-slate-400">
                       <tr>
                          <th className="p-5">Cliente</th>
                          <th className="p-5 text-center">Nível</th>
                          <th className="p-5 text-center">Pedidos</th>
                          <th className="p-5 text-right">Status</th>
                       </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">
                       {automationData.segmentation.map((client: any) => (
                          <tr key={client.id} className="text-[11px] font-bold hover:bg-slate-50 transition-all">
                             <td className="p-5">
                                <p className="text-slate-900 ">{client.name}</p>
                                <p className="text-slate-400 font-medium">{client.phone}</p>
                             </td>
                             <td className="p-5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black  ${client.level === 'VIP' ? 'bg-purple-100 text-purple-600' : client.level === 'FREQUENTE' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>{client.level}</span>
                             </td>
                             <td className="p-5 text-center text-slate-900">
                                {client.totalOrders}
                             </td>
                             <td className="p-5 text-right">
                                <div className="flex items-center justify-end gap-1.5 text-green-500 font-black  text-[8px]">
                                   <CheckCircle size={12} /> Ativo
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>

                 </table>
              </div>
           </div>
        )}

        {/* MODAIS */}
        {(isAddingAffiliate || editingAffiliate) && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
               <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                     <h4 className="text-lg font-black text-slate-900 ">{editingAffiliate ? 'Editar Parceiro' : 'Novo Parceiro'}</h4>
                     <button onClick={() => { setIsAddingAffiliate(false); setEditingAffiliate(null); }} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><Plus className="rotate-45" size={20}/></button>
                  </div>
                  <form onSubmit={async (e) => {
                     e.preventDefault();
                     const formData = new FormData(e.currentTarget);
                     const data = Object.fromEntries(formData);
                     
                     if (editingAffiliate) {
                        await fetch("/api/marketing/affiliates", {
                           method: "PATCH",
                           body: JSON.stringify({ ...data, id: editingAffiliate.id })
                        });
                        toast.success("Parceiro atualizado!");
                     } else {
                        await fetch("/api/marketing/affiliates", {
                           method: "POST",
                           body: JSON.stringify(data)
                        });
                        toast.success("Parceiro criado!");
                     }
                     
                     setIsAddingAffiliate(false);
                     setEditingAffiliate(null);
                     fetchData();
                  }} className="p-6 space-y-4">
                     <div>
                        <label className="text-[9px] font-black text-slate-400  tracking-widest mb-1 block">Nome do Influencer</label>
                        <input name="name" defaultValue={editingAffiliate?.name} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-purple-500 transition-all" placeholder="Ex: João das Pizzas" />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="text-[9px] font-black text-slate-400  tracking-widest mb-1 block">Código (Cupom)</label>
                           <input name="code" defaultValue={editingAffiliate?.code} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-purple-500 transition-all" placeholder="EX: JOAO10" />
                        </div>
                        <div>
                           <label className="text-[9px] font-black text-slate-400  tracking-widest mb-1 block">Comissão (%)</label>
                           <input name="commission" defaultValue={editingAffiliate?.commission} type="number" step="0.1" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-purple-500 transition-all" placeholder="10" />
                        </div>
                     </div>
                     <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black  text-[10px] tracking-widest hover:bg-purple-500 transition-all shadow-xl mt-2">
                        {editingAffiliate ? 'Salvar Alterações' : 'Cadastrar Influencer'}
                     </button>
                  </form>
               </div>
            </div>
         )}

        {isAddingUpsell && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                 <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h4 className="text-xl font-black text-slate-900 ">Regra de Upsell</h4>
                    <button onClick={() => setIsAddingUpsell(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><Plus className="rotate-45" size={24}/></button>
                 </div>
                 <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    await fetch("/api/marketing/upsell", {
                       method: "POST",
                       body: JSON.stringify(Object.fromEntries(formData))
                    });
                    setIsAddingUpsell(false);
                    fetchData();
                    toast.success("Regra ativada!");
                 }} className="p-8 space-y-6">
                    <div>
                       <label className="text-[10px] font-black text-slate-400  tracking-widest mb-2 block">Identificação da Regra</label>
                       <input name="name" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-purple-500 transition-all" placeholder="Ex: Combo de Batata" />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400  tracking-widest mb-2 block">Se o cliente comprar:</label>
                       <select name="triggerProductId" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-purple-500 transition-all">
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400  tracking-widest mb-2 block">Sugerir este produto:</label>
                       <select name="suggestProductId" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-purple-500 transition-all">
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400  tracking-widest mb-2 block">Preço Promocional (Opcional)</label>
                       <input name="discountPrice" type="number" step="0.01" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-purple-500 transition-all" placeholder="Ex: 5.90" />
                    </div>
                    <button type="submit" className="w-full bg-purple-500 text-white py-5 rounded-2xl font-black  text-xs tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-purple-500/20">Ativar Automação</button>
                 </form>
              </div>
           </div>
        )}

      </main>
    </div>
  );
}
