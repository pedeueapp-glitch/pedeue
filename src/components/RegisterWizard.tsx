"use client";

import { useState, useEffect } from "react";
import {
   User, Mail, Lock, Store, Globe, ArrowRight, ArrowLeft,
   Check, CreditCard, Loader2, Star, ShoppingBag, Eye, EyeOff,
   LayoutDashboard, LayoutTemplate, CheckCircle2, Phone
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Step = "user" | "store" | "plan" | "payment";

export function RegisterWizard({ onClose }: { onClose?: () => void }) {
   const router = useRouter();
   const [step, setStep] = useState<Step>("user");
   const [loading, setLoading] = useState(false);
   const [plans, setPlans] = useState<any[]>([]);
   const [showPass, setShowPass] = useState(false);

   const [form, setForm] = useState({
      name: "",
      email: "",
      password: "",
      storeName: "",
      slug: "",
      storeType: "RESTAURANT", 
      planId: "",
      whatsapp: "",
      cpf: ""
   });

   useEffect(() => {
      fetch("/api/plans").then(res => res.json()).then(setPlans);
   }, []);

   function validateCPF(cpf: string) {
      cpf = cpf.replace(/[^\d]+/g, '');
      if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
      const cpfs = cpf.split('').map(el => +el);
      
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

   async function loginAndGo() {
      await signIn("credentials", {
         email: form.email,
         password: form.password,
         redirect: false
      });
      router.push("/dashboard");
   }

   function handleNext() {
      if (step === "user") {
         if (!validateCPF(form.cpf)) return toast.error("CPF inválido");
         setStep("store");
      }
      else if (step === "store") setStep("plan");
   }

   async function handleFinish() {
      setLoading(true);
      try {
         const res = await fetch("/api/auth/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
         });
         const data = await res.json();

         if (!res.ok) throw new Error(data.error);

         toast.success("Conta criada! Você tem 3 dias grátis para testar o sistema.");
         loginAndGo();
      } catch (error: any) {
         toast.error(error.message);
      } finally {
         setLoading(false);
      }
   }

   const renderProgress = () => (
      <div className="flex items-center justify-between mb-8 px-4">
         {[
            { id: "user", icon: User, label: "Perfil" },
            { id: "store", icon: Store, label: "Loja" },
            { id: "plan", icon: Star, label: "Plano" }
         ].map((s, i) => {
            const isActive = step === s.id;
            const isDone = ["user", "store", "plan"].indexOf(step) > i;
            return (
               <div key={s.id} className="flex flex-col items-center gap-2 flex-1 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${isDone ? "bg-purple-500 text-white" : isActive ? "bg-purple-500 shadow-xl shadow-purple-500/20 text-white scale-110" : "bg-slate-100 text-slate-400"
                     }`}>
                     {isDone ? <Check size={18} /> : <s.icon size={18} />}
                  </div>
                  <span className={`text-[10px] font-black  tracking-widest ${isActive || isDone ? "text-purple-500" : "text-slate-300"}`}>
                     {s.label}
                  </span>
                  {i < 2 && (
                     <div className="absolute top-5 left-1/2 w-full h-[2px] bg-slate-100 -z-0">
                        <div className={`h-full bg-purple-500 transition-all duration-700 ${["store", "plan"].includes(step) && i === 0 ? "w-full" : ["plan"].includes(step) && i === 1 ? "w-full" : "w-0"}`}></div>
                     </div>
                  )}
               </div>
            );
         })}
      </div>
   );

   return (
      <div className="w-full max-w-2xl bg-white border border-slate-100 rounded-xl p-8 shadow-2xl relative overflow-hidden">
         {/* Soft light glow effect */}
         <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/5 blur-[80px] pointer-events-none" />

         {step !== "payment" && renderProgress()}

         {/* STEP: USER */}
         {step === "user" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900  tracking-tighter">Crie sua conta</h2>
                  <p className="text-slate-400 text-sm">Seus dados de acesso ao painel gestor</p>
               </div>

               <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group">
                        <label className="text-[10px] font-black  text-slate-400 ml-1 mb-1 block tracking-widest">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Ex: João da Silva"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="group">
                        <label className="text-[10px] font-black  text-slate-400 ml-1 mb-1 block tracking-widest">CPF (Obrigatório)</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                            <input
                                type="text"
                                value={maskCPF(form.cpf)}
                                onChange={e => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "") })}
                                placeholder="000.000.000-00"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-500 transition-all"
                            />
                        </div>
                    </div>
                  </div>

                  <div className="group">
                     <label className="text-[10px] font-black  text-slate-400 ml-1 mb-1 block tracking-widest">E-mail</label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                        <input
                           type="email"
                           value={form.email}
                           onChange={e => setForm({ ...form, email: e.target.value })}
                           placeholder="voce@exemplo.com"
                           className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-500 transition-all"
                        />
                     </div>
                  </div>

                  <div className="group">
                     <label className="text-[10px] font-black  text-slate-400 ml-1 mb-1 block tracking-widest">Senha de Acesso</label>
                     <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                        <input
                           type={showPass ? "text" : "password"}
                           value={form.password}
                           onChange={e => setForm({ ...form, password: e.target.value })}
                           placeholder="••••••••"
                           className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 pl-12 pr-12 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-500 transition-all"
                        />
                        <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors">
                           {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                     </div>
                  </div>
               </div>

               <button
                  disabled={!form.name || !form.email || form.password.length < 6 || !form.cpf}
                  onClick={handleNext}
                  className="w-full bg-purple-500 hover:bg-slate-900 text-white font-black py-5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-20 disabled:grayscale shadow-xl shadow-purple-500/20"
               >
                  PRÓXIMO PASSO <ArrowRight size={18} />
               </button>
            </div>
         )}

         {/* STEP: STORE */}
         {step === "store" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900  tracking-tighter">Sua Loja Digital</h2>
                  <p className="text-slate-400 text-sm">Como os seus clientes verão seu negócio</p>
               </div>

               <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group">
                        <label className="text-[10px] font-black  text-slate-400 ml-1 mb-1 block tracking-widest">Nome da Loja</label>
                        <div className="relative">
                            <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                            <input
                                type="text"
                                value={form.storeName}
                                onChange={e => {
                                    const name = e.target.value;
                                    const slug = name.toLowerCase()
                                        .normalize("NFD")
                                        .replace(/[\u0300-\u036f]/g, "")
                                        .replace(/[^a-z0-9]/g, "")
                                        .trim();
                                    setForm({ ...form, storeName: name, slug: slug });
                                }}
                                placeholder="Ex: Burger King Center"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="group">
                        <label className="text-[10px] font-black  text-slate-400 ml-1 mb-1 block tracking-widest">WhatsApp Loja</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                            <input
                                type="text"
                                value={maskPhone(form.whatsapp)}
                                onChange={e => {
                                    setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, "").substring(0, 11) });
                                }}
                                placeholder="55 (11) 99999-9999"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-500 transition-all"
                            />
                        </div>
                    </div>
                  </div>

                  <div className="group">
                      <label className="text-[10px] font-black  text-slate-400 ml-1 mb-1 block tracking-widest">Link da Loja (Subdomínio)</label>
                      <div className="relative flex items-center">
                         <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors z-10" />
                         <input
                            type="text"
                            value={form.slug}
                            onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/ /g, "-") })}
                            placeholder="minha-loja"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 pl-12 pr-[105px] text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-purple-500 transition-all"
                         />
                         <div className="absolute right-4 text-slate-400 font-bold pointer-events-none select-none text-[11px]">.pedeue.com</div>
                      </div>
                   </div>

                  <div>
                     <label className="text-[10px] font-black  text-slate-400 ml-1 mb-3 block tracking-widest">Tipo de Negócio</label>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                        <button
                           onClick={() => setForm({ ...form, storeType: "RESTAURANT" })}
                           className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${form.storeType === "RESTAURANT" ? "bg-purple-500/5 border-purple-500 text-purple-500 shadow-xl shadow-purple-500/10" : "bg-slate-50 border-slate-100 text-slate-400"}`}
                        >
                           <LayoutTemplate size={24} />
                           <span className="text-[10px] sm:text-[11px] font-black  tracking-tight text-left">Cardápio</span>
                           <span className="text-[9px] font-bold opacity-70 italic-none text-left">Delivery para Lanchonetes</span>
                        </button>
                        <button
                           onClick={() => setForm({ ...form, storeType: "SHOWCASE" })}
                           className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${form.storeType === "SHOWCASE" ? "bg-purple-500/5 border-purple-500 text-purple-500 shadow-xl shadow-purple-500/10" : "bg-slate-50 border-slate-100 text-slate-400"}`}
                        >
                           <LayoutDashboard size={24} />
                           <span className="text-[10px] sm:text-[11px] font-black  tracking-tight text-left">Vitrine</span>
                           <span className="text-[9px] font-bold opacity-70 italic-none text-left">Roupas e Acessórios</span>
                        </button>
                        <button
                           onClick={() => setForm({ ...form, storeType: "SERVICE" })}
                           className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${form.storeType === "SERVICE" ? "bg-purple-500/5 border-purple-500 text-purple-500 shadow-xl shadow-purple-500/10" : "bg-slate-50 border-slate-100 text-slate-400"}`}
                        >
                           <User size={24} />
                           <span className="text-[10px] sm:text-[11px] font-black  tracking-tight text-left">Orçamentos</span>
                           <span className="text-[9px] font-bold opacity-70 italic-none text-left">Papelarias e Outros</span>
                        </button>
                     </div>
                  </div>
               </div>

               <div className="flex gap-4">
                  <button
                     onClick={() => setStep("user")}
                     className="w-1/3 border-2 border-slate-100 text-slate-400 font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-slate-50"
                  >
                     <ArrowLeft size={18} /> VOLTAR
                  </button>
                  <button
                     disabled={!form.storeName || !form.slug || !form.whatsapp}
                     onClick={handleNext}
                     className="w-2/3 bg-purple-500 hover:bg-slate-900 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-20 shadow-xl shadow-purple-500/20"
                  >
                     CONTINUAR <ArrowRight size={18} />
                  </button>
               </div>
            </div>
         )}

         {/* STEP: PLAN */}
         {step === "plan" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900  tracking-tighter">Escolha seu Plano</h2>
                  <p className="text-slate-400 text-sm">Teste todas as funcionalidades agora</p>
               </div>

               <div className="bg-purple-500/5 border border-purple-500/10 p-6 rounded-xl mb-8 relative overflow-hidden group">
                  <div className="flex items-start gap-4 relative z-10">
                     <div className="bg-purple-500 p-2 rounded-xl text-white">
                        <Check size={20} />
                     </div>
                     <div className="text-left">
                        <p className="text-purple-600 font-black text-sm  tracking-tight">EXPERIMENTE GRÁTIS POR 3 DIAS</p>
                        <p className="text-slate-500 text-xs font-bold mt-1 leading-relaxed">
                           Você terá acesso total ao sistema imediatamente. <span className="text-purple-600">Nenhum pagamento é necessário hoje.</span> Escolha o plano que melhor se adapta ao seu negócio apenas para teste inicial.
                        </p>
                     </div>
                  </div>
                  <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full group-hover:bg-purple-500/10 transition-all duration-700" />
               </div>

               <div className="grid grid-cols-1 gap-4 max-h-[350px] overflow-y-auto px-1 custom-scrollbar">
                  {plans.map((plan) => (
                     <button
                        key={plan.id}
                        onClick={() => setForm({ ...form, planId: plan.id })}
                        className={`p-6 rounded-xl border-2 transition-all flex items-center justify-between group ${form.planId === plan.id ? "bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-500/20" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-purple-200"}`}
                     >
                        <div className="text-left">
                           <h3 className={`font-black  tracking-tight ${form.planId === plan.id ? "text-white" : "text-slate-900 group-hover:text-purple-500"}`}>{plan.name}</h3>
                           <div className="flex items-baseline gap-1">
                              <span className={`text-xl font-black ${form.planId === plan.id ? "text-white" : "text-slate-900"}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}</span>
                              <span className={`text-[10px] font-bold ${form.planId === plan.id ? "text-purple-200" : "text-slate-400"}`}>/mês</span>
                           </div>
                        </div>
                        {form.planId === plan.id && <div className="w-8 h-8 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-lg"><Check size={16} /></div>}
                     </button>
                  ))}
               </div>

               <div className="flex gap-4">
                  <button
                     onClick={() => setStep("store")}
                     className="w-1/3 border-2 border-slate-100 text-slate-400 font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-slate-50"
                  >
                     <ArrowLeft size={18} /> VOLTAR
                  </button>
                  <button
                     disabled={!form.planId || loading}
                     onClick={handleFinish}
                     className="w-2/3 bg-purple-500 hover:bg-slate-900 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-20 shadow-xl shadow-purple-500/20"
                  >
                     {loading ? <Loader2 className="animate-spin text-white" /> : "ATIVAR MINHA CONTA"} <CheckCircle2 size={18} />
                  </button>
               </div>
            </div>
         )}
      </div>
   );
}
