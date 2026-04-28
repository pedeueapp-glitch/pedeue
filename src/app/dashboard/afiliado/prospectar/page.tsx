"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Sparkles,
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
  let val = value.replace(/\D/g, "").substring(0, 11);
  if (val.length > 7)
    return `(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7)}`;
  if (val.length > 2) return `(${val.substring(0, 2)}) ${val.substring(2)}`;
  if (val.length > 0) return `(${val}`;
  return val;
}

export default function ProspectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
    whatsapp: "",
    cpf: "",
    planId: "",
  });

  useEffect(() => {
    fetch("/api/plans")
      .then(res => res.json())
      .then(data => {
        setPlans(data);
        if (data.length > 0) {
          setForm(prev => ({ ...prev, planId: data[0].id }));
        }
      });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    let value = e.target.value;
    if (e.target.name === "cpf") value = maskCPF(value);
    if (e.target.name === "whatsapp") value = value.replace(/\D/g, "").substring(0, 11);
    setForm({ ...form, [e.target.name]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.planId) {
      toast.error("Selecione um plano para o lojista");
      return;
    }
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
      <div className="max-w-2xl mx-auto text-center py-20 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-[40px] bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Lojista Prospectado!</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
            A loja <span className="text-purple-600 font-black tracking-tight">{done}</span> foi criada com sucesso e já está vinculada ao seu faturamento recorrente.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={() => { setDone(null); setForm({ name: "", email: "", password: "", storeName: "", whatsapp: "", cpf: "", planId: plans[0]?.id || "" }); }}
            className="px-10 py-5 rounded-[24px] bg-purple-500 text-white text-xs font-black tracking-widest hover:bg-purple-600 transition-all shadow-xl shadow-purple-500/20"
          >
            CADASTRAR OUTRO
          </button>
          <Link
            href="/dashboard/afiliado/clientes"
            className="px-10 py-5 rounded-[24px] bg-white border border-slate-100 text-slate-500 text-xs font-black tracking-widest hover:bg-slate-50 transition-all"
          >
            VER MEUS CLIENTES
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="space-y-1">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 text-xs font-bold uppercase tracking-widest transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-2 text-purple-600 text-[10px] font-black uppercase tracking-widest mb-1">
          <UserPlus className="w-4 h-4" />
          <span>Expansão de Mercado</span>
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Novo Registro de Loja</h1>
        <p className="text-slate-400 text-sm font-medium">Cadastre um novo lojista e comece a faturar comissões vitalícias.</p>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Lojista</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input name="name" value={form.name} onChange={handleChange} className="input-field pl-12" placeholder="Ex: João Silva" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CPF do Lojista</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input name="cpf" value={form.cpf} onChange={handleChange} className="input-field pl-12" placeholder="000.000.000-00" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome da Loja</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input name="storeName" value={form.storeName} onChange={handleChange} className="input-field pl-12" placeholder="Ex: Restaurante Central" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Contato</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input name="whatsapp" value={maskPhone(form.whatsapp)} onChange={handleChange} className="input-field pl-12" placeholder="(11) 99999-9999" required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email de Acesso</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field pl-12" placeholder="lojista@exemplo.com" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha Provisória</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type={showPass ? "text" : "password"} name="password" value={form.password} onChange={handleChange} className="input-field pl-12 pr-12" placeholder="Mínimo 8 caracteres" minLength={8} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-purple-500 transition-colors">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Seleção de Plano */}
          <div className="space-y-4 pt-6 border-t border-slate-50">
            <div className="flex items-center gap-2 text-purple-600 text-[10px] font-black uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Seleção de Plano para o Lojista</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan: any) => (
                <div 
                  key={plan.id}
                  onClick={() => setForm({ ...form, planId: plan.id })}
                  className={`cursor-pointer group relative rounded-[32px] border-2 p-6 transition-all ${form.planId === plan.id ? 'border-purple-500 bg-purple-500/5 shadow-xl shadow-purple-500/10' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                >
                   {form.planId === plan.id && (
                     <div className="absolute top-4 right-4 text-purple-500">
                        <CheckCircle2 size={20} />
                     </div>
                   )}
                   <p className={`text-xs font-black uppercase tracking-widest ${form.planId === plan.id ? 'text-purple-600' : 'text-slate-400'}`}>{plan.name}</p>
                   <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-800">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                      <span className="text-[10px] font-bold text-slate-400">/mês</span>
                   </div>
                   <p className="mt-4 text-[10px] text-slate-400 font-medium leading-relaxed">{plan.description || "Recursos completos para o lojista crescer."}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 rounded-[24px] bg-purple-500 text-white text-xs font-black tracking-widest hover:bg-purple-600 transition-all shadow-2xl shadow-purple-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
              {isLoading ? "PROCESSANDO REGISTRO..." : "FINALIZAR CADASTRO DO LOJISTA"}
            </button>
          </div>
        </form>
      </div>

      <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
        O lojista receberá os dados de acesso no email cadastrado.
      </p>
    </div>
  );
}
