"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
   ShoppingBag,
   ArrowRight,
   Store,
   CheckCircle2,
   ShieldCheck,
   Zap,
   Smartphone,
   BarChart3,
   X,
   Play
} from "lucide-react";
import { RegisterWizard } from "@/components/RegisterWizard";
import { LoginModal } from "@/components/LoginModal";

export default function HomePage() {
   const [isWizardOpen, setIsWizardOpen] = useState(false);
   const [isLoginOpen, setIsLoginOpen] = useState(false);
   const [plans, setPlans] = useState<any[]>([]);
   const [scrolled, setScrolled] = useState(false);

   useEffect(() => {
      fetch("/api/plans").then(res => res.json()).then(setPlans);

      const handleScroll = () => setScrolled(window.scrollY > 50);
      window.addEventListener("scroll", handleScroll);
      
      if (typeof window !== "undefined") {
         const urlParams = new URLSearchParams(window.location.search);
         if (urlParams.get("register") === "true") {
            setIsWizardOpen(true);
            // Optionally, clean the URL
            window.history.replaceState({}, document.title, "/");
         }
      }
      
      return () => window.removeEventListener("scroll", handleScroll);
   }, []);

   const openRegister = () => {
      setIsLoginOpen(false);
      setIsWizardOpen(true);
   };

   return (
      <main className="min-h-screen bg-white text-gray-900 selection:bg-purple-500 selection:text-white">
         {/* GLOW BACKGROUNDS */}
         <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
         <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

         {/* NAVBAR */}
         <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-4 bg-white/80 backdrop-blur-xl border-b border-purple-500/10" : "py-8 bg-transparent"}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
               <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="h-12 w-auto flex items-center justify-center transition-transform group-hover:scale-105">
                     <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain" />
                  </div>
               </div>

               <div className="hidden md:flex items-center gap-10">
                  <a href="#funcionalidades" className="text-xs font-black  tracking-widest text-gray-600 hover:text-purple-600 transition-colors">Funcionalidades</a>
                  <a href="#planos" className="text-xs font-black  tracking-widest text-gray-600 hover:text-purple-600 transition-colors">Preços</a>
                  <Link href="https://loja-demo.pedeue.com" className="text-xs font-black  tracking-widest text-purple-500 hover:text-purple-400 transition-colors flex items-center gap-2">
                     VER DEMO <Play size={12} fill="currentColor" />
                  </Link>
               </div>

               <div className="flex items-center gap-4">
                  <button
                     onClick={() => setIsLoginOpen(true)}
                     className="text-xs font-black  tracking-widest text-gray-600 hover:text-purple-600 transition-colors"
                  >
                     Entrar
                  </button>
                  <button
                     onClick={() => setIsWizardOpen(true)}
                     className="px-6 py-3 bg-gray-900 text-white text-[10px] font-black  tracking-widest rounded-full hover:bg-purple-500 transition-all shadow-xl"
                  >
                     Começar Agora
                  </button>
               </div>
            </div>
         </nav>

         {/* HERO SECTION */}
         <section className="relative pt-44 pb-32 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
               <div className="space-y-8 relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 animate-pulse">
                     <Zap size={14} />
                     <span className="text-[10px] font-black  tracking-widest">Plataforma 100% Brasileira</span>
                  </div>

                  <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter italic-not-really">
                     VENDA MAIS <br />
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600">SEM COMISSÃO.</span>
                  </h1>

                  <p className="text-lg text-gray-600 max-w-lg leading-relaxed font-medium">
                     Escolha seu modo de venda: Vitrine de Produtos, Cardápio Digital ou Catálogo de Serviços. Teste grátis por 3 dias e receba pedidos no seu WhatsApp, usando nosso aplicativo de computador com impressão automática!
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                     <button
                        onClick={() => setIsWizardOpen(true)}
                        className="px-10 py-5 bg-purple-500 text-white font-black  tracking-widest text-xs rounded-2xl hover:bg-purple-600 transition-all shadow-2xl shadow-purple-500/30 flex items-center justify-center gap-3"
                     >
                        CRIAR MINHA LOJA AGORA <ArrowRight size={18} />
                     </button>
                     <Link
                        href="https://loja-demo.pedeue.com"
                        className="px-10 py-5 bg-purple-50 text-purple-700 border border-purple-100 font-black  tracking-widest text-xs rounded-2xl hover:bg-purple-100 transition-all flex items-center justify-center gap-3"
                     >
                        VER EXEMPLO <Store size={18} />
                     </Link>
                  </div>
               </div>

               <div className="relative group">
                  <div className="absolute inset-0 bg-purple-500/10 blur-[100px] rounded-full group-hover:bg-purple-500/20 transition-all duration-700" />
                  <div className="relative aspect-square rounded-[40px] bg-gradient-to-tr from-purple-500/5 to-purple-500/10 border border-purple-500/20 p-4 transform rotate-3 hover:rotate-0 transition-transform duration-700 overflow-hidden shadow-2xl backdrop-blur-3xl">
                     <div className="w-full h-full rounded-[24px] bg-white border border-purple-500/10 p-8 flex flex-col gap-6">
                        <div className="h-4 w-1/3 bg-purple-500/10 rounded-full" />
                        <div className="h-32 w-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-2xl border border-purple-500/10" />
                        <div className="space-y-3">
                           <div className="h-4 w-full bg-purple-500/10 rounded-full" />
                           <div className="h-4 w-2/3 bg-purple-500/10 rounded-full" />
                        </div>
                        <div className="mt-auto flex justify-between items-center">
                           <div className="h-10 w-24 bg-purple-500 rounded-xl" />
                           <div className="h-10 w-10 bg-purple-500/10 rounded-full" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* FUNCIONALIDADES */}
         <section id="funcionalidades" className="py-32 px-6 border-t border-purple-500/10">
            <div className="max-w-7xl mx-auto space-y-20">
               <div className="text-center space-y-4">
                  <h2 className="text-xs font-black  tracking-[0.3em] text-purple-500">Recursos Premium</h2>
                  <p className="text-4xl md:text-5xl font-black tracking-tighter">O PODER DA SUA LOJA EM UM SÓ LUGAR.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                     { title: "WhatsApp Direto", desc: "Receba pedidos organizados no seu número, sem complicação.", icon: Smartphone },
                     { title: "Impressão Automática", desc: "Nosso aplicativo de computador imprime seus pedidos sozinho.", icon: Zap },
                     { title: "3 Modos de Loja", desc: "Venda com Vitrine, Catálogo de Serviços ou Cardápio Digital.", icon: Store },
                     { title: "3 Dias Grátis", desc: "Teste o sistema inteiro sem pagar nada por 3 dias.", icon: ShieldCheck },
                  ].map((item, i) => (
                     <div key={i} className="p-10 rounded-[32px] bg-white border border-purple-500/10 shadow-sm hover:border-purple-500/30 transition-all group">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-all text-purple-500">
                           <item.icon size={24} />
                        </div>
                        <h3 className="text-lg font-black  mb-3">{item.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* PLANOS */}
         <section id="planos" className="py-32 px-6 bg-gradient-to-b from-transparent to-purple-500/5">
            <div className="max-w-5xl mx-auto space-y-20">
               <div className="text-center space-y-4">
                  <h2 className="text-xs font-black  tracking-[0.3em] text-purple-500">Nossos Planos</h2>
                  <p className="text-4xl md:text-5xl font-black tracking-tighter">OS RECURSOS REAIS QUE SEU NEGÓCIO PRECISA.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {plans.length > 0 ? plans.map((plan, i) => (
                     <div key={plan.id} className={`p-12 rounded-[40px] border flex flex-col gap-8 transition-all hover:-translate-y-2 ${i === 1 ? "bg-purple-950 text-white border-purple-800 shadow-2xl shadow-purple-900/20" : "bg-white border-purple-500/10 text-gray-900 shadow-sm"}`}>
                        <div className="space-y-4">
                           <span className={`text-[10px] font-black  tracking-widest px-3 py-1 rounded-full ${i === 1 ? "bg-purple-500 text-white" : "bg-purple-50 text-purple-500"}`}>{plan.name}</span>
                           <div className="flex items-baseline gap-2">
                              <span className="text-6xl font-black tracking-tighter">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(plan.price)}</span>
                              <span className={`text-xs font-black  opacity-60`}>/mês</span>
                           </div>
                           <p className={`text-sm font-medium ${i === 1 ? "text-purple-200" : "text-gray-500"}`}>{plan.description || "Tudo que seu negócio precisa para escalar."}</p>
                        </div>

                        <div className="space-y-4 flex-1">
                           {[
                              "Zero taxas sobre vendas", 
                              "Pedidos ilimitados", 
                              "App para Computador", 
                              "PDV c/ Impressão"
                           ].concat(
                              Array.isArray(plan.features) ? plan.features.map((f: string) => 
                                 f === "PDV_SYSTEM" ? "Gestão de Caixa PDV" :
                                 f === "TABLE_MANAGEMENT" ? "Controle de Mesas" :
                                 f === "COUPON_SYSTEM" ? "Cupons de Desconto" : f
                              ) : ["Suporte humanizado"]
                           ).slice(0, 5).map((feat, index) => (
                              <div key={index} className="flex items-center gap-3">
                                 <CheckCircle2 size={18} className={`${i === 1 ? 'text-purple-400' : 'text-purple-500'}`} />
                                 <span className="text-xs font-black  tracking-wider">{feat}</span>
                              </div>
                           ))}
                        </div>

                        <button
                           onClick={() => setIsWizardOpen(true)}
                           className={`w-full py-5 rounded-2xl font-black  tracking-widest text-xs transition-all ${i === 1 ? "bg-purple-500 text-white hover:bg-white hover:text-purple-950" : "bg-purple-50 text-purple-700 hover:bg-purple-500 hover:text-white"}`}
                        >
                           EU QUERO ESTE PLANO
                        </button>
                     </div>
                  )) : (
                     <div className="col-span-2 py-20 text-center animate-pulse">
                        <span className="text-xs font-black text-gray-600  tracking-[0.5em]">Carregando pacotes de escala...</span>
                     </div>
                  )}
               </div>
            </div>
         </section>

         {/* CTA SECTION */}
         <section className="py-32 px-6">
            <div className="max-w-7xl mx-auto rounded-[60px] bg-purple-600 p-12 md:p-24 relative overflow-hidden flex flex-col items-center text-center gap-8">
               <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
               <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter max-w-3xl relative z-10 italic-not-really">
                  A REVOLUÇÃO DO SEU <br /> VAREJO COMEÇA AQUI.
               </h2>
               <button
                  onClick={() => setIsWizardOpen(true)}
                  className="relative z-10 px-12 py-6 bg-white text-black font-black  tracking-[0.2em] text-xs rounded-full hover:scale-110 active:scale-95 transition-all shadow-2xl"
               >
                  CRIAR MINHA LOJA GRATUITAMENTE
               </button>
               <p className="text-white/60 text-xs font-black  tracking-widest relative z-10">Não pedimos cartão de crédito agora.</p>
            </div>
         </section>

         {/* FOOTER */}
         <footer className="py-12 px-6 border-t border-purple-500/10">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="flex items-center gap-2">
                  <div className="h-10 w-auto flex items-center justify-center">
                     <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain" />
                  </div>
               </div>

               <p className="text-[10px] font-black  text-gray-600 tracking-widest">© 2026 PedeUe. Feito com orgulho no Brasil.</p>

               <div className="flex gap-8">
                  <a href="#" className="text-xs font-black text-gray-500 hover:text-white transition-colors">POLÍTICA</a>
                  <a href="#" className="text-xs font-black text-gray-500 hover:text-white transition-colors">TERMOS</a>
                  <a href="#" className="text-xs font-black text-gray-500 hover:text-white transition-colors">AJUDA</a>
               </div>
            </div>
         </footer>

         {/* MODALS OVERLAY */}
         {(isWizardOpen || isLoginOpen) && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
               <button
                  onClick={() => { setIsWizardOpen(false); setIsLoginOpen(false); }}
                  className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors"
               >
                  <X size={32} />
               </button>

               {isWizardOpen && <RegisterWizard onClose={() => setIsWizardOpen(false)} />}
               {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} onRegisterClick={openRegister} />}
            </div>
         )}
      </main>
   );
}
