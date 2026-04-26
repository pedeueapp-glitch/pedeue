"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  Phone,
  Store,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

function maskCPF(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
}

function maskPhone(value: string) {
  const val = value.replace(/\D/g, "").substring(0, 11);
  if (val.length > 7)
    return `(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7)}`;
  if (val.length > 2) return `(${val.substring(0, 2)}) ${val.substring(2)}`;
  if (val.length > 0) return `(${val}`;
  return val;
}

const fields = [
  { name: "name", label: "Nome completo do lojista", placeholder: "João Silva", icon: User, type: "text" },
  { name: "cpf", label: "CPF do lojista", placeholder: "000.000.000-00", icon: CreditCard, type: "text" },
  { name: "storeName", label: "Nome da loja", placeholder: "Padaria do João", icon: Store, type: "text" },
  { name: "whatsapp", label: "WhatsApp", placeholder: "(11) 99999-8888", icon: Phone, type: "tel" },
  { name: "email", label: "Email de acesso", placeholder: "joao@email.com", icon: Mail, type: "email" },
];

export default function ProspectPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
    whatsapp: "",
    cpf: "",
    planId: "",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plans, setPlans] = useState<{ id: string; name: string; price: number }[]>([]);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => {
        setPlans(data);
        if (data.length > 0) {
          setForm((f) => ({ ...f, planId: data[0].id }));
        }
      });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value;
    if (e.target.name === "cpf") value = maskCPF(value);
    if (e.target.name === "whatsapp") value = value.replace(/\D/g, "").substring(0, 11);
    setForm({ ...form, [e.target.name]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/afiliado/lojas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao criar conta");
        return;
      }

      setDone(data.storeSlug);
      toast.success("Lojista cadastrado com sucesso!");
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Lojista cadastrado!</h2>
        <p className="text-slate-500 mb-6 font-medium">
          A loja <span className="text-emerald-600 font-bold">{done}</span> foi criada, vinculada à sua conta e ganhou <span className="font-bold text-emerald-600">3 dias grátis</span>. Você receberá a comissão definida assim que a primeira mensalidade for paga.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { setDone(null); setForm({ name: "", email: "", password: "", storeName: "", whatsapp: "", cpf: "", planId: "" }); }}
            className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
          >
            Cadastrar outro lojista
          </button>
          <Link
            href="/painel-afiliado/clientes"
            className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:shadow-md transition-all uppercase tracking-widest text-[10px] flex items-center justify-center"
          >
            Ver meus clientes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link
        href="/painel-afiliado"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-widest mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mb-2">
          <UserPlus className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Prospectar Loja</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Cadastrar novo lojista</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          Preencha os dados do lojista. A loja será automaticamente vinculada à sua conta e receberá 3 dias grátis de assinatura do plano escolhido.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de Plano */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">
              Plano de Assinatura
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                name="planId"
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm font-semibold appearance-none"
                required
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - R$ {plan.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1.5 ml-1">+ 3 Dias Grátis</p>
          </div>

          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">
                {field.label}
              </label>
              <div className="relative">
                <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={field.type}
                  name={field.name}
                  value={
                    field.name === "whatsapp"
                      ? maskPhone((form as Record<string, string>)[field.name])
                      : (form as Record<string, string>)[field.name]
                  }
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm font-semibold"
                  required
                />
              </div>
            </div>
          ))}

          {/* Senha */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">
              Senha de acesso do lojista
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPass ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm font-semibold"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || plans.length === 0}
              className="w-full py-4 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Cadastrar lojista
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="text-center text-slate-400 font-semibold text-[10px] uppercase tracking-widest mt-6">
        A loja será vinculada permanentemente à sua conta de afiliado.
      </p>
    </div>
  );
}
