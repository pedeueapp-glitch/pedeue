"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  ShieldCheck, 
  Save, 
  Loader2, 
  Fingerprint,
  Banknote
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";

export default function AffiliateSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [formData, setFormData] = useState<any>({
    name: "",
    pixKey: "",
    pixKeyType: "CPF",
    cpf: "",
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/me");
      const data = await res.json();
      if (data) {
        setFormData({
          name: data.name || "",
          pixKey: data.platformAffiliate?.pixKey || "",
          pixKeyType: data.platformAffiliate?.pixKeyType || "CPF",
          cpf: data.platformAffiliate?.cpf || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/afiliado/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: formData.name,
            pixKey: formData.pixKey,
            pixKeyType: formData.pixKeyType,
            cpf: formData.cpf.replace(/\D/g, "")
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar");
      toast.success("Dados atualizados!");
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

      toast.success("Senha alterada!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return (
     <div className="flex-1 flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-purple-500" />
     </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Header title="Configurações de Parceiro" />
      
      <div className="max-w-5xl mx-auto w-full space-y-6 pt-6 px-4 animate-in fade-in duration-500">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dados de Parceiro</h1>
          <p className="text-slate-400 text-xs font-medium">Dados de perfil e recebimento via PIX.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário Principal */}
            <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 space-y-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input className="input-field !py-2.5 pl-10 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Seu nome" required />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Seu CPF</label>
                                <div className="relative">
                                    <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input 
                                        className="input-field !py-2.5 pl-10 text-sm" 
                                        value={maskCPF(formData.cpf)} 
                                        onChange={e => setFormData({...formData, cpf: e.target.value})} 
                                        placeholder="000.000.000-00" 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Chave PIX</label>
                                <select 
                                    className="input-field !py-2.5 px-3 text-sm appearance-none bg-white" 
                                    value={formData.pixKeyType} 
                                    onChange={e => setFormData({...formData, pixKeyType: e.target.value})}
                                >
                                    <option value="CPF">CPF</option>
                                    <option value="EMAIL">E-mail</option>
                                    <option value="PHONE">Telefone</option>
                                    <option value="RANDOM">Chave Aleatória</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sua Chave PIX</label>
                                <div className="relative">
                                    <Banknote className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input 
                                        className="input-field !py-2.5 pl-10 text-sm border-emerald-50 focus:border-emerald-500" 
                                        value={formData.pixKey} 
                                        onChange={e => setFormData({...formData, pixKey: e.target.value})} 
                                        placeholder="Digite sua chave" 
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={saving} className="w-full bg-purple-600 text-white py-3.5 rounded-xl text-xs font-black tracking-widest hover:bg-purple-700 transition-all shadow-md flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                    </button>
                </form>
            </div>

            {/* Segurança Lateral */}
            <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-sm">
                    <div className="space-y-1">
                        <h3 className="text-base font-black text-slate-800 tracking-tight">Alterar Senha</h3>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Mantenha seu acesso seguro.</p>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-3">
                        <input 
                            type="password" 
                            className="input-field !py-2.5 !text-xs" 
                            placeholder="Senha Atual"
                            value={passwordData.currentPassword}
                            onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            required 
                        />
                        <input 
                            type="password" 
                            className="input-field !py-2.5 !text-xs" 
                            placeholder="Nova Senha"
                            value={passwordData.newPassword}
                            onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                            required 
                        />
                        <input 
                            type="password" 
                            className="input-field !py-2.5 !text-xs" 
                            placeholder="Confirmar Nova"
                            value={passwordData.confirmPassword}
                            onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            required 
                        />
                        <button 
                            type="submit" 
                            disabled={changingPassword}
                            className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-slate-900 transition-all disabled:opacity-50"
                        >
                            {changingPassword ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                            {changingPassword ? "..." : "ATUALIZAR SENHA"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
