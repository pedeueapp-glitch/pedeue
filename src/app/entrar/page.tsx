"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  ShoppingBag,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Acesso negado. Verifique email e senha.");
      } else {
        toast.success("Bem-vindo de volta!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao entrar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-navy/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
        
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
           <div className="inline-flex p-4 bg-navy text-white rounded-[24px] shadow-2xl shadow-navy/20 mb-4">
              <ShoppingBag size={32} />
           </div>
           <h1 className="text-4xl font-black text-navy tracking-tighter">Portal do Lojista</h1>
           <p className="text-slate-400 font-medium italic-none">Gerencie seu delivery com inteligência.</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-navy/5 border border-white relative z-10">
           <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu E-mail Administrativo</label>
                 <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input 
                       type="email" 
                       required
                       className="w-full h-[56px] bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-navy placeholder:text-slate-300 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                       placeholder="exemplo@email.com"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Senha</label>
                    <Link href="#" className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:text-navy transition-colors">Esqueceu?</Link>
                 </div>
                 <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input 
                       type="password" 
                       required
                       className="w-full h-[56px] bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-navy placeholder:text-slate-300 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                       placeholder="••••••••"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       autoComplete="current-password"
                    />
                 </div>
              </div>

              <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full h-[60px] bg-navy text-white rounded-[24px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-orange-500 shadow-xl shadow-navy/10 hover:shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                 {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                 ) : (
                    <>
                       Acessar Painel <ArrowRight size={18} />
                    </>
                 )}
              </button>
           </form>
        </div>

        {/* Footer Link */}
        <div className="text-center">
           <p className="text-sm font-medium text-slate-400 italic-none">
              Ainda não tem uma conta?{" "}
              <Link href="/cadastrar" className="text-navy font-black hover:text-orange-500 transition-colors underline-offset-4 hover:underline">
                 Criar Loja Grátis
              </Link>
           </p>
        </div>

        {/* Alerta de Demo */}
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-4">
           <div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm">
              <AlertCircle size={18} />
           </div>
           <p className="text-[10px] font-bold text-orange-700/60 leading-relaxed uppercase tracking-wider italic-none">
              Portal restrito. Se você é um cliente, aguarde o link do cardápio da loja.
           </p>
        </div>

      </div>
    </div>
  );
}
