"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  ShieldCheck, 
  Save, 
  Loader2, 
  ArrowLeft,
  Fingerprint,
  Banknote
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

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
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
      <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full space-y-10">
        
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 text-xs font-bold uppercase tracking-widest transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Painel
          </Link>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Configurações do Afiliado</h1>
          <p className="text-slate-400 text-sm font-medium">Mantenha seus dados de pagamento e perfil sempre atualizados.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Formulário Principal */}
            <div className="lg:col-span-2 space-y-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 space-y-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input className="input-field pl-12" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Seu nome" required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Seu CPF</label>
                            <div className="relative">
                                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input 
                                    className="input-field pl-12" 
                                    value={maskCPF(formData.cpf)} 
                                    onChange={e => setFormData({...formData, cpf: e.target.value})} 
                                    placeholder="000.000.000-00" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Chave PIX</label>
                                <select 
                                    className="input-field px-4" 
                                    value={formData.pixKeyType} 
                                    onChange={e => setFormData({...formData, pixKeyType: e.target.value})}
                                >
                                    <option value="CPF">CPF</option>
                                    <option value="EMAIL">E-mail</option>
                                    <option value="PHONE">Telefone</option>
                                    <option value="RANDOM">Chave Aleatória</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sua Chave PIX</label>
                                <div className="relative">
                                    <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input 
                                        className="input-field pl-12 border-emerald-100 focus:border-emerald-500" 
                                        value={formData.pixKey} 
                                        onChange={e => setFormData({...formData, pixKey: e.target.value})} 
                                        placeholder="Digite sua chave" 
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={saving} className="w-full bg-purple-600 text-white py-5 rounded-[24px] text-xs font-black tracking-widest hover:bg-purple-700 transition-all shadow-2xl shadow-purple-500/20 flex items-center justify-center gap-3">
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                    </button>
                </form>
            </div>

            {/* Segurança Lateral */}
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                <div className="bg-white rounded-[40px] border border-slate-100 p-8 space-y-8 shadow-sm">
                    <div className="space-y-2">
                        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                            <Lock size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Alterar Senha</h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">Mantenha seu acesso seguro atualizando sua senha periodicamente.</p>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <input 
                            type="password" 
                            className="input-field !py-3 !text-xs" 
                            placeholder="Senha Atual"
                            value={passwordData.currentPassword}
                            onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            required 
                        />
                        <input 
                            type="password" 
                            className="input-field !py-3 !text-xs" 
                            placeholder="Nova Senha"
                            value={passwordData.newPassword}
                            onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                            required 
                        />
                        <input 
                            type="password" 
                            className="input-field !py-3 !text-xs" 
                            placeholder="Confirmar Nova"
                            value={passwordData.confirmPassword}
                            onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            required 
                        />
                        <button 
                            type="submit" 
                            disabled={changingPassword}
                            className="w-full py-4 bg-[#0f172a] text-white rounded-2xl font-black tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-navy/90 transition-all shadow-lg disabled:opacity-50"
                        >
                            {changingPassword ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
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
