"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2, X, ArrowRight } from "lucide-react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function LoginModal({ onClose, onRegisterClick }: { onClose: () => void, onRegisterClick?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverLoading, setRecoverLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("E-mail ou senha incorretos");
      } else {
        toast.success("Login realizado com sucesso!");
        
        const session = await getSession();
        const role = (session?.user as any)?.role;

        if (role === "SUPERADMIN") {
          router.push("/superadmin");
        } else if (role === "AFFILIATE") {
          router.push("/painel-afiliado");
        } else {
          router.push("/dashboard");
        }
        
        onClose();
      }
    } catch (error) {
      toast.error("Erro ao realizar login");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email) {
      toast.error("Por favor, informe seu e-mail.");
      return;
    }
    setRecoverLoading(true);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || "E-mail de recuperação enviado!");
      setIsRecovering(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setRecoverLoading(false);
    }
  }

  return (
     <div className="w-full max-w-md bg-white border border-slate-100 rounded-[32px] p-10 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/5 blur-[80px] pointer-events-none" />
        
        {isRecovering ? (
           <form onSubmit={handleRecover} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-10">
                 <h2 className="text-3xl font-black text-slate-900  tracking-tighter">Recuperar Senha</h2>
                 <p className="text-slate-400 text-xs font-bold  tracking-widest mt-2">Enviaremos um link para o seu e-mail</p>
              </div>

              <div className="group">
                 <label className="text-[10px] font-black  text-slate-400 ml-1 mb-1 block tracking-widest">Seu E-mail</label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                    <input 
                       type="email" 
                       required
                       value={form.email}
                       onChange={e => setForm({...form, email: e.target.value})}
                       placeholder="voce@exemplo.com"
                       className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-500 transition-all"
                    />
                 </div>
              </div>

              <div className="flex gap-4">
                 <button 
                    type="button"
                    onClick={() => setIsRecovering(false)}
                    className="w-1/3 bg-slate-50 hover:bg-slate-100 text-slate-400 font-black py-5 rounded-2xl flex items-center justify-center transition-all"
                 >
                    VOLTAR
                 </button>
                 <button 
                    type="submit"
                    disabled={recoverLoading}
                    className="w-2/3 bg-purple-500 hover:bg-purple-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-purple-500/20"
                 >
                    {recoverLoading ? <Loader2 className="animate-spin" size={18} /> : "ENVIAR LINK"}
                 </button>
              </div>
           </form>
        ) : (
           <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="text-center mb-10">
                 <h2 className="text-3xl font-black text-slate-900  tracking-tighter">Bem-vindo de volta</h2>
                 <p className="text-slate-400 text-xs font-bold  tracking-widest mt-2">Acesse sua plataforma de gestão</p>
              </div>

              <div className="group">
                 <label className="text-[10px] font-black  text-slate-400 ml-1 mb-1 block tracking-widest">Seu E-mail</label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                    <input 
                       type="email" 
                       required
                       value={form.email}
                       onChange={e => setForm({...form, email: e.target.value})}
                       placeholder="voce@exemplo.com"
                       className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-500 transition-all"
                    />
                 </div>
              </div>

              <div className="group">
                 <div className="flex justify-between items-center px-1 mb-1">
                    <label className="text-[10px] font-black  text-slate-400 tracking-widest">Sua Senha</label>
                    <button type="button" onClick={() => setIsRecovering(true)} className="text-[10px] font-black  text-purple-500 tracking-widest hover:underline">Esqueceu?</button>
                 </div>
                 <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                    <input 
                       type={showPass ? "text" : "password"} 
                       required
                       value={form.password}
                       onChange={e => setForm({...form, password: e.target.value})}
                       placeholder="••••••••"
                       className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-12 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-500 transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors">
                       {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                 </div>
              </div>

              <button 
                 type="submit"
                 disabled={loading}
                 className="w-full bg-slate-900 hover:bg-purple-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl"
              >
                 {loading ? <Loader2 className="animate-spin" size={18} /> : (
                    <>ENTRAR NO PAINEL <ArrowRight size={18} /></>
                 )}
              </button>

              <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                 <p className="text-xs text-slate-400 font-bold  tracking-tight">
                    Ainda não tem conta? <button type="button" onClick={onRegisterClick} className="text-purple-600 hover:underline">Crie agora</button>
                 </p>
              </div>
           </form>
        )}
     </div>
  );
}
