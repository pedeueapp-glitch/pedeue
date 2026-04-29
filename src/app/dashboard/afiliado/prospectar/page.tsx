"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  UserPlus,
  Store,
  Mail,
  Lock,
  Loader2,
  Package,
  ArrowLeft,
} from "lucide-react";
import { Header } from "@/components/Header";

export default function ProspectarPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
    slug: "",
    whatsapp: "",
    cpf: "",
    planId: "",
  });

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlans(data);
          if (data.length > 0) setFormData((prev) => ({ ...prev, planId: data[0].id }));
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações detalhadas para evitar confusão do usuário
    if (!formData.name) return toast.error("Por favor, preencha o Nome do Responsável");
    if (!formData.email) return toast.error("Por favor, preencha o E-mail de Login");
    if (!formData.password) return toast.error("Por favor, defina uma Senha Provisória");
    if (formData.password.length < 8) return toast.error("A senha deve ter no mínimo 8 caracteres");
    if (!formData.cpf) return toast.error("O CPF do Lojista é obrigatório");
    if (!formData.storeName) return toast.error("O Nome do Estabelecimento é obrigatório");
    if (!formData.whatsapp) return toast.error("O WhatsApp de Contato é obrigatório");
    if (!formData.planId) return toast.error("Selecione um plano para a loja");
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/afiliado/lojas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar loja");

      toast.success("Loja cadastrada com sucesso!");
      router.push("/dashboard/afiliado/clientes");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Header title="Prospectar Lojista" />
      
      <div className="max-w-4xl mx-auto w-full space-y-6 pt-6 px-4 animate-in fade-in duration-500">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cadastrar Novo Lojista</h1>
          <p className="text-slate-400 text-xs font-medium">Registre uma nova loja vinculada ao seu código de parceiro.</p>
        </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {/* Dados do Usuário */}
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
             <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <UserPlus size={16} />
             </div>
             <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Acesso do Lojista</h2>
          </div>
          
          <div className="space-y-4">
             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Responsável</label>
               <input 
                 className="input-field !py-2.5 text-sm" 
                 placeholder="Ex: João Silva" 
                 required 
                 value={formData.name}
                 onChange={e => setFormData({...formData, name: e.target.value})}
               />
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail de Login</label>
               <div className="relative">
                 <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                 <input 
                   type="email"
                   className="input-field !py-2.5 pl-10 text-sm" 
                   placeholder="lojista@email.com" 
                   required 
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                 />
               </div>
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha Provisória</label>
               <div className="relative">
                 <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                 <input 
                   type="password"
                   className="input-field !py-2.5 pl-10 text-sm" 
                   placeholder="Mínimo 8 caracteres" 
                   required 
                   value={formData.password}
                   onChange={e => setFormData({...formData, password: e.target.value})}
                 />
               </div>
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CPF do Lojista</label>
               <input 
                 className="input-field !py-2.5 text-sm" 
                 placeholder="000.000.000-00" 
                 required 
                 value={formData.cpf}
                 onChange={e => setFormData({...formData, cpf: e.target.value})}
               />
             </div>
          </div>
        </div>

        {/* Dados da Loja */}
        <div className="space-y-6">
          <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
               <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Store size={16} />
               </div>
               <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Dados da Loja</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Estabelecimento</label>
                <input 
                  className="input-field !py-2.5 text-sm" 
                  placeholder="Ex: Pizzaria do Bairro" 
                  required 
                  value={formData.storeName}
                  onChange={e => setFormData({...formData, storeName: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Link da Loja (Slug)</label>
                <div className="flex">
                   <input 
                     className="input-field !py-2.5 !rounded-r-none text-sm bg-slate-50" 
                     value={formData.slug} 
                     onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                     placeholder="link-da-loja" 
                     required 
                   />
                   <span className="h-[42px] bg-slate-100 border border-l-0 border-slate-200 flex items-center px-3 text-[10px] text-slate-400 font-black rounded-r-xl">.pedeue.com</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Contato</label>
                <input 
                  className="input-field !py-2.5 text-sm" 
                  placeholder="(00) 00000-0000" 
                  required 
                  value={formData.whatsapp}
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Plano Inicial</label>
                <div className="relative">
                  <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <select 
                    className="input-field !py-2.5 pl-10 text-sm appearance-none bg-white" 
                    value={formData.planId}
                    onChange={e => setFormData({...formData, planId: e.target.value})}
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}/mês</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-purple-600 text-white text-[11px] font-black tracking-widest hover:bg-purple-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
            {isLoading ? "PROCESSANDO..." : "FINALIZAR CADASTRO"}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}
