"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [isRecoverLoading, setIsRecoverLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const savedEmail = localStorage.getItem("saved_email");
    const savedPassword = localStorage.getItem("saved_password");
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) {
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

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
        if (rememberMe) {
          localStorage.setItem("saved_email", email);
          localStorage.setItem("saved_password", password);
        } else {
          localStorage.removeItem("saved_email");
          localStorage.removeItem("saved_password");
        }
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

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, digite seu e-mail para recuperar a senha.");
      return;
    }
    setIsRecoverLoading(true);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || "E-mail de recuperação enviado!");
      setIsRecovering(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsRecoverLoading(false);
    }
  };

  const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
  const showElectronUI = isMounted && isElectron;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Elementos Decorativos de Fundo */}
      {!showElectronUI && (
        <>
          <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-navy/5 rounded-full blur-3xl" />
        </>
      )}

      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
        
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
           <div className="inline-flex mb-4">
              <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
           </div>
           <h1 className="text-4xl font-black text-navy tracking-tighter">
             {showElectronUI ? "Acesso ao Sistema" : "Portal do Lojista"}
           </h1>
           <p className="text-slate-400 font-medium italic-none">
             {showElectronUI ? "Bem-vindo de volta ao seu PDV." : "Gerencie seu delivery com inteligência."}
           </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-navy/5 border border-white relative z-10 transition-all">
           {isRecovering ? (
             <form onSubmit={handleRecover} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center mb-6">
                   <h2 className="text-xl font-black text-navy  tracking-tight">Recuperar Senha</h2>
                   <p className="text-xs font-bold text-slate-400 mt-2">Enviaremos um link para o seu e-mail.</p>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">Seu E-mail</label>
                   <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-500 transition-colors" size={20} />
                      <input 
                         type="email" 
                         required
                         className="w-full h-[56px] bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-navy placeholder:text-slate-300 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                         placeholder="exemplo@email.com"
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                      />
                   </div>
                </div>
                <div className="flex gap-4">
                   <button type="button" onClick={() => setIsRecovering(false)} className="w-1/3 h-[60px] bg-slate-50 text-slate-400 rounded-[24px] font-black  text-xs tracking-widest flex items-center justify-center hover:bg-slate-100 transition-all">
                      VOLTAR
                   </button>
                   <button type="submit" disabled={isRecoverLoading} className="w-2/3 h-[60px] bg-purple-500 text-white rounded-[24px] font-black  text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-purple-600 shadow-xl shadow-purple-500/20 transition-all disabled:opacity-50">
                      {isRecoverLoading ? <Loader2 className="animate-spin" size={20} /> : "ENVIAR"}
                   </button>
                </div>
             </form>
           ) : (
             <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">Seu E-mail Administrativo</label>
                   <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-500 transition-colors" size={20} />
                      <input 
                         type="email" 
                         required
                         className="w-full h-[56px] bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-navy placeholder:text-slate-300 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                         placeholder="exemplo@email.com"
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400  tracking-widest">Sua Senha</label>
                      <button type="button" onClick={() => setIsRecovering(true)} className="text-[10px] font-black text-purple-500  tracking-widest hover:text-navy transition-colors">Esqueceu?</button>
                   </div>
                   <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-500 transition-colors" size={20} />
                      <input 
                         type="password" 
                         required
                         className="w-full h-[56px] bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-navy placeholder:text-slate-300 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                         placeholder="••••••••"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         autoComplete="current-password"
                      />
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   <input 
                     type="checkbox" 
                     id="rememberMe" 
                     checked={rememberMe}
                     onChange={(e) => setRememberMe(e.target.checked)}
                     className="w-4 h-4 text-purple-500 rounded border-slate-300 focus:ring-purple-500"
                   />
                   <label htmlFor="rememberMe" className="text-xs font-bold text-slate-500 cursor-pointer">
                     Lembrar de mim neste dispositivo
                   </label>
                 </div>

                <button 
                   type="submit" 
                   disabled={isLoading}
                   className="w-full h-[60px] bg-navy text-white rounded-[24px] font-black  text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-purple-500 shadow-xl shadow-navy/10 hover:shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
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
           )}
        </div>

        {/* Elementos Ocultos no Desktop */}
        {!showElectronUI && (
          <>
            {/* Footer Link */}
            <div className="text-center">
               <p className="text-sm font-medium text-slate-400 italic-none">
                  Ainda não tem uma conta?{" "}
                  <Link href="/?register=true" className="text-navy font-black hover:text-purple-500 transition-colors underline-offset-4 hover:underline">
                     Criar Loja Grátis
                  </Link>
               </p>
            </div>

            {/* Alerta de Demo */}
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex items-center gap-4">
               <div className="p-2 bg-white rounded-xl text-purple-500 shadow-sm">
                  <AlertCircle size={18} />
               </div>
               <p className="text-[10px] font-bold text-purple-700/60 leading-relaxed  tracking-wider italic-none">
                  Portal restrito. Se você é um cliente, aguarde o link do cardápio da loja.
               </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
