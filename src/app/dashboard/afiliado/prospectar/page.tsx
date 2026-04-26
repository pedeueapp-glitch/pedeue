"use client";

import { useState } from "react";
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

const fields = [
  { name: "name", label: "Nome completo do lojista", placeholder: "João Silva", icon: User, type: "text" },
  { name: "cpf", label: "CPF do lojista", placeholder: "000.000.000-00", icon: CreditCard, type: "text" },
  { name: "storeName", label: "Nome da loja", placeholder: "Padaria do João", icon: Store, type: "text" },
  { name: "whatsapp", label: "WhatsApp", placeholder: "(11) 99999-8888", icon: Phone, type: "tel" },
  { name: "email", label: "Email de acesso", placeholder: "joao@email.com", icon: Mail, type: "email" },
];

export default function ProspectPage() {
  const router = useRouter();
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
  });

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
        <h2 className="text-2xl font-bold text-white mb-2">Lojista cadastrado!</h2>
        <p className="text-gray-400 mb-6">
          A loja <span className="text-emerald-400 font-semibold">{done}</span> foi criada e vinculada à sua conta. Você receberá 10% de cada mensalidade paga por esse lojista.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { setDone(null); setForm({ name: "", email: "", password: "", storeName: "", whatsapp: "", cpf: "" }); }}
            className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
          >
            Cadastrar outro lojista
          </button>
          <Link
            href="/dashboard/afiliado/clientes"
            className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-colors"
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
        href="/afiliado"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
          <UserPlus className="w-4 h-4" />
          <span>Prospectar Loja</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Cadastrar novo lojista</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Preencha os dados do lojista. A loja será automaticamente vinculada à sua conta de afiliado.
        </p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#0f0f1a] p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                {field.label}
              </label>
              <div className="relative">
                <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={field.type}
                  name={field.name}
                  value={
                    field.name === "whatsapp"
                      ? maskPhone((form as any)[field.name])
                      : (form as any)[field.name]
                  }
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all text-sm"
                  required
                />
              </div>
            </div>
          ))}

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Senha de acesso
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPass ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all text-sm"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      <p className="text-center text-gray-600 text-xs mt-4">
        Ao cadastrar, essa loja será vinculada permanentemente à sua conta de afiliado.
      </p>
    </div>
  );
}
