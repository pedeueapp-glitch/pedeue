"use client";

import { useState, useEffect } from "react";
import { 
  Store, 
  Camera, 
  Palette, 
  Clock, 
  Settings as SettingsIcon, 
  Smartphone, 
  Link2,
  Save,
  Loader2,
  Trash2,
  Plus,
  Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";

const DAYS_OF_WEEK = [
  "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // general, appearance, hours

  const [formData, setFormData] = useState<any>({
    name: "",
    slug: "",
    description: "",
    whatsapp: "",
    deliveryTime: "30-50",
    primaryColor: "#f97316",
    logo: "",
    coverImage: "",
    openingHours: DAYS_OF_WEEK.map(day => ({ 
      day, 
      enabled: true, 
      open: "08:00", 
      close: "22:00" 
    }))
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store");
      const data = await res.json();
      if (data) {
        let parsedHours = formData.openingHours;
        if (data.openingHours) {
          try {
            const h = typeof data.openingHours === 'string' ? JSON.parse(data.openingHours) : data.openingHours;
            if (Array.isArray(h)) parsedHours = h;
          } catch (e) {}
        }
        setFormData({
          ...data,
          openingHours: parsedHours
        });
      }
    } catch {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Enviando...");
    try {
      const data = new FormData();
      data.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const result = await res.json();
      if (result.url) {
        setFormData((prev: any) => ({ ...prev, [field]: result.url }));
        toast.success("OK!", { id: toastId });
      }
    } catch { toast.error("Erro no upload", { id: toastId }); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || "Erro ao salvar");
      }
      toast.success("Configurações atualizadas!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (index: number) => {
    const newHours = [...formData.openingHours];
    newHours[index].enabled = !newHours[index].enabled;
    setFormData({ ...formData, openingHours: newHours });
  };

  const updateHour = (index: number, field: 'open' | 'close', value: string) => {
    const newHours = [...formData.openingHours];
    newHours[index][field] = value;
    setFormData({ ...formData, openingHours: newHours });
  };

  if (loading) return (
     <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" />
     </div>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
      <Header title="Configurações da Loja" />

      <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Navegação por Abas Premium */}
        <div className="flex bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm w-fit">
           {[
             { id: 'general', label: 'Geral', icon: SettingsIcon },
             { id: 'appearance', label: 'Identidade Visual', icon: Palette },
             { id: 'hours', label: 'Horários de Atendimento', icon: Clock }
           ].map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-navy text-white shadow-lg' : 'text-slate-400 hover:text-navy'}`}
             >
                <tab.icon size={16} />
                {tab.label}
             </button>
           ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           {/* ABA GERAL */}
           {activeTab === 'general' && (
             <div className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 space-y-10 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Fantasia da Loja</label>
                      <div className="relative">
                         <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <input className="input-field pl-12" value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Sua Loja Exemplo" required />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">URL Personalizada (Slug)</label>
                      <div className="relative">
                         <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <div className="flex">
                            <span className="h-[48px] bg-slate-50 border border-r-0 border-slate-200 flex items-center px-4 text-xs text-slate-400 font-bold rounded-l-xl">exemplo.com/loja/</span>
                            <input className="input-field !rounded-l-none" value={formData.slug || ""} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="nome-da-loja" required />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Pedidos</label>
                      <div className="relative">
                         <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <input className="input-field pl-12" value={formData.whatsapp || ""} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="5511999999999" required />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tempo de Entrega (min)</label>
                      <div className="relative">
                         <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <input className="input-field pl-12" value={formData.deliveryTime || ""} onChange={e => setFormData({...formData, deliveryTime: e.target.value})} placeholder="30-45" />
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descrição Curta</label>
                   <textarea className="input-field h-32 resize-none" value={formData.description || ""} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Fale um pouco sobre sua loja..." />
                </div>
             </div>
           )}

           {/* ABA APARÊNCIA */}
           {activeTab === 'appearance' && (
             <div className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 space-y-12 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   
                   {/* Logo Upload */}
                   <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Logotipo Principal</label>
                      <div className="relative w-40 h-40 group">
                         <div className="w-full h-full bg-slate-50 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
                            {formData.logo ? (
                              <img src={formData.logo} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="text-slate-200" size={40} />
                            )}
                         </div>
                         <label className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center cursor-pointer">
                            <Camera className="text-white" size={24} />
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
                         </label>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">PNG ou JPG sugerido (Proporção 1:1)</p>
                   </div>

                   {/* Banner Upload */}
                   <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Banner de Capa</label>
                      <div className="relative w-full h-40 group">
                         <div className="w-full h-full bg-slate-50 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
                            {formData.coverImage ? (
                              <img src={formData.coverImage} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="text-slate-200" size={40} />
                            )}
                         </div>
                         <label className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center cursor-pointer">
                            <Camera className="text-white" size={24} />
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'coverImage')} />
                         </label>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">BANNER panorâmico para o topo do seu cardápio.</p>
                   </div>
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-6">
                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Esquema de Cores do Cardápio</label>
                      <p className="text-[10px] text-slate-400 font-medium">Esta cor será a base de todos os botões e detalhes do seu site.</p>
                   </div>

                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      {/* Cor Escolhida & Picker */}
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 w-full sm:w-auto">
                         <label className="relative cursor-pointer group">
                           <div 
                              style={{ backgroundColor: formData.primaryColor || "#f97316" }}
                              className="w-14 h-14 rounded-xl shadow-lg shadow-black/5 flex items-center justify-center transition-transform active:scale-90"
                           >
                              <Palette size={20} className="text-white mix-blend-difference opacity-50" />
                           </div>
                           <input 
                              type="color" 
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              value={formData.primaryColor || "#f97316"}
                              onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                           />
                         </label>
                         
                         <div className="flex flex-col pr-4">
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Cor Atual</span>
                            <input 
                               type="text"
                               className="bg-transparent font-black text-slate-800 uppercase outline-none text-sm w-24"
                               value={formData.primaryColor || "#f97316"}
                               onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                            />
                         </div>
                      </div>

                      {/* Sugestões Rápidas */}
                      <div className="flex flex-wrap gap-2.5">
                        {['#f97316', '#0f172a', '#22c55e', '#ef4444', '#8b5cf6', '#e11d48', '#3b82f6'].map(color => (
                          <button 
                             key={color}
                             type="button"
                             onClick={() => setFormData({...formData, primaryColor: color})}
                             style={{ backgroundColor: color }}
                             className={`w-10 h-10 rounded-xl transition-all ${formData.primaryColor === color ? 'scale-110 shadow-lg ring-2 ring-white ring-offset-2' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                          />
                        ))}
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* ABA HORÁRIOS */}
           {activeTab === 'hours' && (
             <div className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-slate-800 tracking-tight">Agenda Semanal</h3>
                  <p className="text-xs text-slate-400 mt-1">Sua loja fechará automaticamente fora destes horários.</p>
                </div>

                <div className="divide-y divide-slate-50 border-t border-slate-50">
                   {(Array.isArray(formData.openingHours) ? formData.openingHours : []).map((hour: any, index: number) => (
                     <div key={hour.day} className="py-6 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4 w-40">
                           <div 
                              onClick={() => toggleDay(index)}
                              className={`w-12 h-6 rounded-full transition-all cursor-pointer p-1 relative ${hour.enabled ? 'bg-orange-500' : 'bg-slate-200'}`}
                           >
                              <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-md ${hour.enabled ? 'ml-6' : 'ml-0'}`} />
                           </div>
                           <span className={`font-bold text-xs uppercase tracking-widest ${hour.enabled ? 'text-slate-800' : 'text-slate-300'}`}>{hour.day}</span>
                        </div>

                        {hour.enabled ? (
                          <div className="flex items-center gap-3 animate-in fade-in duration-300">
                             <input 
                               type="time" 
                               className="input-field !py-2 !w-32 !text-xs !bg-slate-50 border-none" 
                               value={hour.open}
                               onChange={e => updateHour(index, 'open', e.target.value)}
                             />
                             <span className="text-slate-300 text-xs font-bold">às</span>
                             <input 
                               type="time" 
                               className="input-field !py-2 !w-32 !text-xs !bg-slate-50 border-none" 
                               value={hour.close}
                               onChange={e => updateHour(index, 'close', e.target.value)}
                             />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-50 px-4 py-2 rounded-xl">Fechado o dia inteiro</span>
                        )}
                     </div>
                   ))}
                </div>
             </div>
           )}

           {/* Botão Salvar Global */}
           <div className="flex justify-end pt-4 pb-20">
              <button 
                type="submit" 
                disabled={saving}
                className="btn-primary !px-12 !py-5 flex items-center gap-3 !rounded-[24px] shadow-2xl"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {saving ? "Registrando alterações..." : "Salvar Configurações da Marca"}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
