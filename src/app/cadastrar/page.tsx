"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  Phone,
  Store,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
    whatsapp: "",
    cpf: "",
  });

  function validateCPF(cpf: string) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    const cpfs = cpf.split('').map(el => +el);
    
    const rest = (count: number) => {
        let sum = 0;
        for (let i = 1; i <= count - 9; i++) {
            sum += cpfs[i-1] * (count - i + 1);
        }
        let r = (sum * 10) % 11;
        if (r === 10 || r === 11) r = 0;
        return r;
    };

    // Algoritmo oficial de validação de CPF
    let sum1 = 0;
    for (let i = 0; i < 9; i++) sum1 += cpfs[i] * (10 - i);
    let r1 = (sum1 * 10) % 11;
    if (r1 === 10 || r1 === 11) r1 = 0;
    if (r1 !== cpfs[9]) return false;

    let sum2 = 0;
    for (let i = 0; i < 10; i++) sum2 += cpfs[i] * (11 - i);
    let r2 = (sum2 * 10) % 11;
    if (r2 === 10 || r2 === 11) r2 = 0;
    if (r2 !== cpfs[10]) return false;

    return true;
  }

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value;
    if (e.target.name === "cpf") value = maskCPF(value);
    if (e.target.name === "whatsapp") {
        value = value.replace(/\D/g, "").substring(0, 11);
    }
    
    setForm({ ...form, [e.target.name]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateCPF(form.cpf)) {
      toast.error("CPF inválido");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao criar conta");
        return;
      }

      toast.success("Conta criada com sucesso!");

      // Auto login
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      router.push("/dashboard");
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  }

  const fields = [
    { name: "name", label: "Seu nome completo", placeholder: "Joao Silva", icon: User, type: "text" },
    { name: "cpf", label: "Seu CPF (Para recebimentos)", placeholder: "000.000.000-00", icon: CreditCard, type: "text" },
    { name: "storeName", label: "Nome da sua loja", placeholder: "Padaria do Joao", icon: Store, type: "text" },
    { name: "whatsapp", label: "WhatsApp", placeholder: "(11) 99999-8888", icon: Phone, type: "tel" },
    { name: "email", label: "Email", placeholder: "seu@email.com", icon: Mail, type: "email" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 py-12">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-brand">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">PedeUe - Delivery</span>
          </Link>
          <p className="text-gray-400 mt-3">Crie sua loja digital gratis</p>
        </div>

        <div className="glass-dark rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {field.label}
                </label>
                <div className="relative">
                  <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={field.type}
                    name={field.name}
                    value={field.name === "whatsapp" ? maskPhone((form as any)[field.name]) : field.name === "cpf" ? maskCPF((form as any)[field.name]) : (form as any)[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-all"
                    required
                  />
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimo 8 caracteres"
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-all"
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

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full !py-3.5 shadow-brand disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando sua loja...
                </>
              ) : (
                "Criar minha loja gratis"
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Ja tem conta?{" "}
            <Link href="/entrar" className="text-purple-400 hover:text-purple-300 font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
