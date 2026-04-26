"use client";

import { useState, useEffect } from "react";
import { User, Lock, CreditCard, Save, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ConfiguracoesAfiliadoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    pixKey: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetch("/api/afiliado/configuracoes")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setForm((prev) => ({
            ...prev,
            name: data.name || "",
            email: data.email || "",
            pixKey: data.pixKey || "",
          }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password && form.password !== form.confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (form.password && form.password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/afiliado/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          pixKey: form.pixKey,
          password: form.password || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar.");
      } else {
        toast.success(data.message || "Configurações salvas com sucesso!");
        setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      }
    } catch (err) {
      toast.error("Erro interno ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-purple-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link
        href="/painel-afiliado"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-widest transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Configurações</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          Atualize seus dados pessoais e informações de repasse.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-purple-500" />
            Dados Pessoais
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
              <input
                value={form.email}
                disabled
                className="w-full bg-slate-100 border border-slate-200 text-slate-500 p-3.5 rounded-xl font-bold text-sm outline-none cursor-not-allowed"
              />
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">O email de login não pode ser alterado.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            Dados para Repasse
          </h2>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chave PIX ou CPF</label>
            <input
              name="pixKey"
              value={form.pixKey}
              onChange={handleChange}
              placeholder="Ex: CPF, Telefone, Email, ou chave aleatória"
              className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm outline-none focus:border-emerald-500 transition-colors"
              required
            />
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">As comissões aprovadas serão enviadas para esta chave PIX.</p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
            <Lock className="w-4 h-4 text-slate-500" />
            Alterar Senha
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nova Senha</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Deixe em branco para manter"
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm outline-none focus:border-slate-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmar Nova Senha</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirme a nova senha"
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm outline-none focus:border-slate-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
