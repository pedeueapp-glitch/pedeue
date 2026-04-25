"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

function RecoverPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      toast.error("Token de recuperação inválido ou ausente.");
      router.push("/entrar");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Senha alterada com sucesso!");
      setIsSuccess(true);
      setTimeout(() => router.push("/entrar"), 3000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 animate-in zoom-in duration-500">
        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-black text-navy tracking-tight">Tudo Certo!</h2>
        <p className="text-sm font-medium text-slate-500">Sua senha foi redefinida com sucesso.</p>
        <p className="text-xs text-slate-400 mt-4">Redirecionando para o login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">Nova Senha</label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-500 transition-colors" size={20} />
          <input 
            type="password" 
            required
            className="w-full h-[56px] bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-navy placeholder:text-slate-300 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">Confirmar Nova Senha</label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-500 transition-colors" size={20} />
          <input 
            type="password" 
            required
            className="w-full h-[56px] bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-navy placeholder:text-slate-300 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isLoading || !password || !confirmPassword}
        className="w-full h-[60px] bg-purple-500 text-white rounded-[24px] font-black  text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-purple-600 shadow-xl shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <>
            Salvar Nova Senha <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}

export default function RecoverPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-navy/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex mb-4">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="text-4xl font-black text-navy tracking-tighter">
            Nova Senha
          </h1>
          <p className="text-slate-400 font-medium italic-none">
            Crie uma nova senha segura para sua conta.
          </p>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-navy/5 border border-white">
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-purple-500" /></div>}>
            <RecoverPasswordForm />
          </Suspense>
        </div>

        <div className="text-center">
          <Link href="/entrar" className="text-sm font-black text-slate-400 hover:text-navy transition-colors">
            VOLTAR PARA O LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
}
