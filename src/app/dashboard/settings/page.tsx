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
  Image as ImageIcon,
  Target,
  ShieldCheck,
  Lock,
  User,
  Fingerprint,
  UtensilsCrossed,
  ShoppingBag,
  Box,
  AlertCircle,
  Banknote,
  Percent,
  CreditCard
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";

const DAYS_OF_WEEK = [
  "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const [formData, setFormData] = useState<any>({
    name: "",
    slug: "",
    description: "",
    whatsapp: "",
    cpf: "",
    deliveryTime: "30-50",
    primaryColor: "#f97316",
    logo: "",
    coverImage: "",
    storeType: "RESTAURANT",
    openingHours: DAYS_OF_WEEK.map(day => ({ 
      day, 
      enabled: true, 
      open: "08:00", 
      close: "22:00" 
    })),
    showcaseBanners: [],
    facebookPixelId: "",
    googleAnalyticsId: "",
    googleTagManagerId: "",
    tiktokPixelId: "",
    pixKey: "",
    pixEnabled: false,
    pixMerchantName: "",
    pixMerchantCity: "",
    freeDeliveryThreshold: 0,
    cardSurchargeType: "PERCENT",
    debitSurchargeValue: 0,
    creditSurchargeValue: 0
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  function maskCPF(value: string) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  }

  function maskPhone(value: string) {
    let val = value.replace(/\D/g, "");
    val = val.substring(0, 11);
    
    let formatted = val;
    if (val.length > 0) formatted = "(" + val;
    if (val.length > 2) formatted = "(" + val.substring(0, 2) + ") " + val.substring(2);
    if (val.length > 7) formatted = formatted.substring(0, 10) + "-" + formatted.substring(10);
    
    return formatted;
  }

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
          storeType: data.storeType || "RESTAURANT",
          openingHours: parsedHours,
          showcaseBanners: typeof data.showcaseBanners === 'string' ? JSON.parse(data.showcaseBanners || '[]') : (data.showcaseBanners || [])
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

  const isExpired = formData?.subscription?.expiresAt && new Date(formData.subscription.expiresAt) < new Date();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (isExpired) {
      toast.error("Assinatura vencida! Renove para alterar sua identidade visual.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Enviando...");
    try {
      const data = new FormData();
      data.set("file", file);
      const isRawField = field === 'logo' || field === 'coverImage';
      const res = await fetch(`/api/upload${isRawField ? '?raw=true' : ''}`, { method: "POST", body: data });
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao trocar senha");

      toast.success("Senha alterada com sucesso!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const toggleDay = (index: number) => {
    if (isExpired) return;
    const newHours = [...formData.openingHours];
    newHours[index].enabled = !newHours[index].enabled;
    setFormData({ ...formData, openingHours: newHours });
  };

  const updateHour = (index: number, field: 'open' | 'close', value: string) => {
    if (isExpired) return;
    const newHours = [...formData.openingHours];
    newHours[index][field] = value;
    setFormData({ ...formData, openingHours: newHours });
  };

  if (loading) return (
     <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" />
     </div>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
      <Header title="Configurações" />

      <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full space-y-8">
        
        {isExpired && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-[32px] flex flex-col sm:flex-row items-center gap-6 justify-between animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center">
                   <AlertCircle size={24} />
                </div>
                <div>
                   <h3 className="text-sm font-black text-red-800  tracking-tight">Assinatura Vencida</h3>
                   <p className="text-xs text-red-600 font-medium">Suas alterações estão bloqueadas, exceto o campo de CPF.</p>
                </div>
             </div>
             <button 
               onClick={() => window.location.href = '/dashboard/subscription'}
               className="bg-red-500 text-white px-6 py-3 rounded-xl text-[10px] font-black  tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
             >
                Renovar Agora
             </button>
          </div>
        )}

        <div className="flex bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm w-full sm:w-fit overflow-x-auto no-scrollbar">
           {[
             { id: 'general', label: 'Geral', icon: SettingsIcon },
             { id: 'appearance', label: 'Identidade Visual', icon: Palette },
             { id: 'hours', label: 'Horários', icon: Clock },
             { id: 'tracking', label: 'Pixels', icon: Target },
             { id: 'domain', label: 'Domínio', icon: Link2 },
             { id: 'security', label: 'Segurança', icon: ShieldCheck },
           ].map(tab => (
             <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center sm:justify-start gap-3 px-6 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex-1 sm:flex-initial ${activeTab === tab.id ? 'bg-[#0f172a] text-white shadow-lg' : 'text-slate-400 hover:text-[#0f172a]'}`}
             >
                <tab.icon size={16} />
                <span>{tab.label}</span>
             </button>
           ))}
        </div>

        {activeTab !== 'security' ? (
          <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* ABA GERAL */}
             {activeTab === 'general' && (
               <div className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 space-y-10 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Nome Fantasia da Loja</label>
                        <div className="relative">
                           <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <input disabled={isExpired} className="input-field pl-12 disabled:opacity-50 disabled:cursor-not-allowed" value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Sua Loja Exemplo" required />
                        </div>
                     </div>

                     <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">URL Personalizada (Slug)</label>
                         <div className="relative">
                            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <div className="flex">
                               <input disabled={isExpired} className="input-field !rounded-r-none pl-12 disabled:opacity-50 disabled:cursor-not-allowed" value={formData.slug || ""} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="nome-da-loja" required />
                               <span className="h-[48px] bg-slate-50 border border-l-0 border-slate-200 flex items-center px-4 text-xs text-slate-400 font-bold rounded-r-xl">.pedeue.com</span>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">WhatsApp de Pedidos</label>
                        <div className="relative">
                           <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <input 
                            disabled={isExpired} 
                            className="input-field pl-12 disabled:opacity-50 disabled:cursor-not-allowed" 
                            value={maskPhone(formData.whatsapp || "")} 
                            onChange={e => {
                                setFormData({...formData, whatsapp: e.target.value.replace(/\D/g, "").substring(0, 11)});
                            }} 
                            placeholder="55 (11) 99999-9999" 
                            required 
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">CPF do Lojista (Para Pagamentos)</label>
                         <div className="relative">
                            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            {/* CPF PERMANECE HABILITADO MESMO VENCIDO */}
                            <input 
                             className="input-field pl-12 border-purple-200" 
                             value={maskCPF(formData.cpf || "")} 
                             onChange={e => setFormData({...formData, cpf: e.target.value.replace(/\D/g, "")})} 
                             placeholder="000.000.000-00" 
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Chave PIX para Recebimento</label>
                        <div className="relative">
                           <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <input 
                            disabled={isExpired}
                            className="input-field pl-12 disabled:opacity-50 disabled:cursor-not-allowed" 
                            value={formData.pixKey || ""} 
                            onChange={e => setFormData({...formData, pixKey: e.target.value})} 
                            placeholder="Sua chave PIX" 
                           />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Tempo de Entrega (min)</label>
                        <div className="relative">
                           <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <input disabled={isExpired} className="input-field pl-12 disabled:opacity-50 disabled:cursor-not-allowed" value={formData.deliveryTime || ""} onChange={e => setFormData({...formData, deliveryTime: e.target.value})} placeholder="30-45" />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Frete Grátis acima de (R$)</label>
                        <div className="relative">
                           <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <input 
                            disabled={isExpired} 
                            type="number"
                            step="0.01"
                            className="input-field pl-12 disabled:opacity-50 disabled:cursor-not-allowed" 
                            value={formData.freeDeliveryThreshold} 
                            onChange={e => setFormData({...formData, freeDeliveryThreshold: parseFloat(e.target.value || "0")})} 
                            placeholder="Ex: 100.00 (0 para desativar)" 
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Descrição Curta</label>
                     <textarea disabled={isExpired} className="input-field h-32 resize-none disabled:opacity-50 disabled:cursor-not-allowed" value={formData.description || ""} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Fale um pouco sobre sua loja..." />
                  </div>

                   </div>
                   
                   <div className="space-y-6 pt-10 border-t border-slate-50">
                      <div>
                         <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                           <CreditCard size={18} className="text-purple-500" />
                           Taxas de Acréscimo no Cartão
                         </h3>
                         <p className="text-[10px] text-slate-400 font-medium">Configure cobranças adicionais para pagamentos em cartão.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 tracking-widest ml-1">Tipo de Acréscimo</label>
                            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                               <button 
                                 type="button"
                                 onClick={() => setFormData({...formData, cardSurchargeType: 'PERCENT'})}
                                 className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${formData.cardSurchargeType === 'PERCENT' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
                               >
                                 Porcentagem (%)
                               </button>
                               <button 
                                 type="button"
                                 onClick={() => setFormData({...formData, cardSurchargeType: 'FIXED'})}
                                 className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${formData.cardSurchargeType === 'FIXED' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
                               >
                                 Valor Fixo (R$)
                               </button>
                            </div>
                         </div>

                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 tracking-widest ml-1">
                              Acréscimo Débito {formData.cardSurchargeType === 'PERCENT' ? '(%)' : '(R$)'}
                            </label>
                            <div className="relative">
                               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                 {formData.cardSurchargeType === 'PERCENT' ? <Percent size={16} /> : <span className="text-xs font-bold">R$</span>}
                               </div>
                               <input 
                                 type="number"
                                 step="0.01"
                                 disabled={isExpired}
                                 className="input-field pl-12 disabled:opacity-50" 
                                 value={formData.debitSurchargeValue} 
                                 onChange={e => setFormData({...formData, debitSurchargeValue: parseFloat(e.target.value || "0")})} 
                                 placeholder="0.00" 
                               />
                            </div>
                         </div>

                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 tracking-widest ml-1">
                              Acréscimo Crédito {formData.cardSurchargeType === 'PERCENT' ? '(%)' : '(R$)'}
                            </label>
                            <div className="relative">
                               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                 {formData.cardSurchargeType === 'PERCENT' ? <Percent size={16} /> : <span className="text-xs font-bold">R$</span>}
                               </div>
                               <input 
                                 type="number"
                                 step="0.01"
                                 disabled={isExpired}
                                 className="input-field pl-12 disabled:opacity-50" 
                                 value={formData.creditSurchargeValue} 
                                 onChange={e => setFormData({...formData, creditSurchargeValue: parseFloat(e.target.value || "0")})} 
                                 placeholder="0.00" 
                               />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4 pt-6 border-t border-slate-50">
                     <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Segmento da Loja (Tipo)</label>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { id: 'RESTAURANT', label: 'Cardápio Digital', icon: UtensilsCrossed, desc: 'Pedidos online com entrega' },
                          { id: 'SHOWCASE', label: 'Vitrine Online', icon: ShoppingBag, desc: 'Catálogo sem pedidos diretos' },
                          { id: 'SERVICE', label: 'Prestação de Serviços', icon: Box, desc: 'Orçamentos e agendamentos' },
                        ].map(type => {
                           const allowedTypesStr = formData?.subscription?.plan?.allowedStoreTypes || "RESTAURANT,SHOWCASE,SERVICE";
                           const isAllowed = allowedTypesStr.includes(type.id);
                           const isLocked = isExpired || !isAllowed;

                           return (
                             <button
                                key={type.id}
                                type="button"
                                disabled={isLocked}
                                onClick={() => {
                                  if (isAllowed) setFormData({...formData, storeType: type.id});
                                }}
                                className={`flex flex-col items-center gap-3 p-6 rounded-[32px] border-2 transition-all text-left relative overflow-hidden ${formData.storeType === type.id ? 'border-purple-500 bg-purple-500/5 shadow-md' : 'border-slate-100 hover:border-slate-200 bg-white'} ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                             >
                                {!isAllowed && (
                                   <div className="absolute top-4 right-4 text-slate-300">
                                      <Lock size={14} />
                                   </div>
                                )}
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formData.storeType === type.id ? 'bg-purple-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                   <type.icon size={24} />
                                </div>
                                <div className="text-center">
                                   <p className={`text-xs font-black  tracking-tight ${formData.storeType === type.id ? 'text-purple-600' : 'text-slate-800'}`}>
                                     {type.label}
                                   </p>
                                   <p className="text-[10px] text-slate-400 font-medium mt-1 leading-tight">
                                     {!isAllowed ? "Não incluso no plano atual" : type.desc}
                                   </p>
                                </div>
                             </button>
                           );
                        })}
                     </div>
                  </div>
               </div>
             )}

             {/* ABA APARÊNCIA */}
             {activeTab === 'appearance' && (
               <div className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 space-y-12 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Logotipo</label>
                        <div className="relative w-40 h-40 group">
                           <div className="w-full h-full bg-slate-50 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
                              {formData.logo ? (
                                <img src={formData.logo} className="w-full h-full object-cover" alt="Logo" />
                              ) : (
                                <ImageIcon className="text-slate-200" size={40} />
                              )}
                           </div>
                           <label className={`absolute inset-0 bg-navy/60 opacity-0 ${isExpired ? 'cursor-not-allowed' : 'group-hover:opacity-100 cursor-pointer'} transition-opacity rounded-3xl flex items-center justify-center`}>
                              <Camera className="text-white" size={24} />
                              <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} disabled={isExpired} />
                           </label>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Banner de Capa</label>
                        <div className="relative w-full h-40 group">
                           <div className="w-full h-full bg-slate-50 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
                              {formData.coverImage ? (
                                <img src={formData.coverImage} className="w-full h-full object-cover" alt="Cover" />
                              ) : (
                                <ImageIcon className="text-slate-200" size={40} />
                              )}
                           </div>
                           <label className={`absolute inset-0 bg-navy/60 opacity-0 ${isExpired ? 'cursor-not-allowed' : 'group-hover:opacity-100 cursor-pointer'} transition-opacity rounded-3xl flex items-center justify-center`}>
                              <Camera className="text-white" size={24} />
                              <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'coverImage')} disabled={isExpired} />
                           </label>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-50">
                     <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Cor Primária da Loja</label>
                     <div className="flex items-center gap-4">
                        <input 
                           type="color" 
                           disabled={isExpired}
                           className="w-20 h-20 rounded-2xl cursor-pointer border-none p-1 bg-slate-50 disabled:opacity-50" 
                           value={formData.primaryColor || "#f97316"} 
                           onChange={e => setFormData({...formData, primaryColor: e.target.value})} 
                        />
                        <div className="flex-1">
                           <input 
                              disabled={isExpired}
                              className="input-field disabled:opacity-50" 
                              value={formData.primaryColor || ""} 
                              onChange={e => setFormData({...formData, primaryColor: e.target.value})} 
                              placeholder="#000000" 
                           />
                           <p className="text-[10px] text-slate-400 font-medium mt-2">Esta cor será aplicada em botões, links e detalhes do seu catálogo.</p>
                        </div>
                     </div>
                  </div>
               </div>
             )}

             {/* ABA HORÁRIOS */}
             {activeTab === 'hours' && (
               <div className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 shadow-sm space-y-6">
                  <div className="divide-y divide-slate-50">
                     {formData.openingHours.map((hour: any, index: number) => (
                       <div key={hour.day} className="py-6 flex flex-col sm:flex-row justify-between items-center gap-6">
                          <div className="flex items-center gap-4 w-40">
                             <div 
                                onClick={() => toggleDay(index)}
                                className={`w-12 h-6 rounded-full transition-all cursor-pointer p-1 relative ${hour.enabled ? 'bg-purple-500' : 'bg-slate-200'} ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
                             >
                                <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-md ${hour.enabled ? 'ml-6' : 'ml-0'}`} />
                             </div>
                             <span className={`font-bold text-xs  tracking-widest ${hour.enabled ? 'text-slate-800' : 'text-slate-300'}`}>{hour.day}</span>
                          </div>

                          {hour.enabled ? (
                            <div className="flex items-center gap-3">
                               <input disabled={isExpired} type="time" className="input-field !py-2 !w-32 !text-xs !bg-slate-50 border-none disabled:opacity-50" value={hour.open} onChange={e => updateHour(index, 'open', e.target.value)} />
                               <span className="text-slate-300 text-xs font-bold">às</span>
                               <input disabled={isExpired} type="time" className="input-field !py-2 !w-32 !text-xs !bg-slate-50 border-none disabled:opacity-50" value={hour.close} onChange={e => updateHour(index, 'close', e.target.value)} />
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-red-400  tracking-widest bg-red-50 px-4 py-2 rounded-xl">Fechado</span>
                          )}
                       </div>
                     ))}
                  </div>
               </div>
             )}

             {/* ABA RASTREIO */}
             {activeTab === 'tracking' && (
               <div className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 shadow-sm space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Facebook Pixel ID</label>
                        <input disabled={isExpired} className="input-field disabled:opacity-50" value={formData.facebookPixelId || ""} onChange={e => setFormData({...formData, facebookPixelId: e.target.value})} placeholder="Ex: 123456789012345" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Google Analytics ID</label>
                        <input disabled={isExpired} className="input-field disabled:opacity-50" value={formData.googleAnalyticsId || ""} onChange={e => setFormData({...formData, googleAnalyticsId: e.target.value})} placeholder="Ex: G-XXXXXXXXXX" />
                     </div>
                  </div>
               </div>
             )}



             {/* ABA DOMÍNIO */}
             {activeTab === 'domain' && (
               <div className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 shadow-sm space-y-10 animate-in fade-in slide-in-from-bottom-4">
                  <div className="max-w-2xl space-y-8">
                     <div>
                        <h3 className="text-xl font-bold text-slate-800">Domínio Personalizado</h3>
                        <p className="text-sm text-slate-400 mt-2">Use seu próprio endereço (ex: www.sualoja.com.br) para acessar seu catálogo.</p>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Seu Domínio</label>
                        <div className="relative">
                           <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <input 
                            disabled={isExpired} 
                            className="input-field pl-12 disabled:opacity-50" 
                            value={formData.customDomain || ""} 
                            onChange={e => setFormData({...formData, customDomain: e.target.value.toLowerCase().trim()})} 
                            placeholder="www.sualoja.com.br" 
                           />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-2">Não inclua http:// ou https:// no campo acima.</p>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Endereço da sua Loja</p>
                          <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                             <Link2 size={16} className="text-purple-500" />
                             <span className="text-xs font-bold text-slate-600">{formData?.slug}.pedeue.com</span>
                          </div>
                       </div>
                     </div>

                     <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center gap-3 text-amber-700">
                           <AlertCircle size={20} />
                           <span className="text-xs font-black  tracking-widest">Instruções de Apontamento DNS</span>
                        </div>
                        <p className="text-xs text-amber-600 leading-relaxed font-medium">
                           Para que seu domínio funcione, você precisa configurar os registros DNS no seu provedor (Registro.br, Cloudflare, etc):
                        </p>
                        <div className="space-y-3">
                           <div className="bg-white/50 p-3 rounded-xl border border-amber-200">
                              <p className="text-[10px] font-bold text-amber-800  mb-1">Tipo: A</p>
                              <p className="text-xs font-mono text-amber-600">Apontar para o IP: <span className="font-bold">82.25.68.234</span></p>
                           </div>
                           <div className="bg-white/50 p-3 rounded-xl border border-amber-200">
                              <p className="text-[10px] font-bold text-amber-800  mb-1">Tipo: CNAME (para www)</p>
                              <p className="text-xs font-mono text-amber-600">Apontar para: <span className="font-bold">pedeue.com</span></p>
                           </div>
                        </div>
                        <p className="text-[10px] text-amber-500 font-bold italic">
                           * A propagação do DNS pode levar até 24 horas.
                        </p>
                     </div>
                  </div>
               </div>
             )}

             <div className="flex justify-end pt-4 pb-20">
                <button type="submit" disabled={saving} className="btn-primary !px-12 !py-5 flex items-center gap-3 !rounded-[24px] shadow-2xl">
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </button>
             </div>
          </form>
        ) : (
          /* ABA SEGURANÇA (TROCAR SENHA) */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
             <div className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 space-y-10 shadow-sm">
                <div className="max-w-md space-y-8">
                   <div>
                      <h3 className="text-xl font-bold text-slate-800">Segurança da Conta</h3>
                      <p className="text-sm text-slate-400 mt-2">Mantenha sua conta protegida alterando sua senha regularmente.</p>
                   </div>

                   <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Senha Atual</label>
                         <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                               disabled={isExpired}
                               type="password" 
                               className="input-field pl-12 disabled:opacity-50" 
                               value={passwordData.currentPassword}
                               onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                               required 
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Nova Senha</label>
                         <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                               disabled={isExpired}
                               type="password" 
                               className="input-field pl-12 disabled:opacity-50" 
                               value={passwordData.newPassword}
                               onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                               required 
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Confirmar Nova Senha</label>
                         <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                               disabled={isExpired}
                               type="password" 
                               className="input-field pl-12 disabled:opacity-50" 
                               value={passwordData.confirmPassword}
                               onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                               required 
                            />
                         </div>
                      </div>

                      <button 
                         type="submit" 
                         disabled={changingPassword || isExpired}
                         className="w-full py-4 bg-[#0f172a] text-white rounded-2xl font-black  tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-navy/90 transition-all shadow-lg disabled:opacity-50"
                      >
                         {changingPassword ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
                         {changingPassword ? "Alterando..." : "Alterar Minha Senha"}
                      </button>
                   </form>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
