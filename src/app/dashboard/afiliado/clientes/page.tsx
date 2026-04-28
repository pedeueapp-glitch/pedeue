"use client";

import { useEffect, useState } from "react";
import {
  Store,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AffiliateClientsPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/afiliado/lojas")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStores(data);
      })
      .catch(() => toast.error("Erro ao carregar lojas"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-6 px-4 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Minha Rede de Lojistas</h1>
          <p className="text-slate-400 text-xs font-medium">Gestão das lojas indicadas e status de ativação.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
             <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Total de Indicações</p>
             <p className="text-lg font-black text-blue-700">{stores.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Users size={18} className="text-slate-400" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Lojas Vinculadas</h2>
           </div>
        </div>

        {loading ? (
           <div className="p-20 flex justify-center"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                       <th className="px-6 py-4">Estabelecimento</th>
                       <th className="px-6 py-4">Plano Atual</th>
                       <th className="px-6 py-4 text-center">Status</th>
                       <th className="px-6 py-4 text-right">Cadastrado em</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {stores.map((store) => {
                      const isExpired = store.subscription?.expiresAt && new Date(store.subscription.expiresAt) < new Date();
                      
                      return (
                        <tr key={store.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                    <Store size={16} />
                                 </div>
                                 <div>
                                    <p className="text-slate-700 text-xs font-bold">{store.name}</p>
                                    <p className="text-[9px] text-slate-400 font-medium">/{store.slug}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                 {store.subscription?.plan?.name || "TRIAL"}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${isExpired ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                                 {isExpired ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                                 {isExpired ? "Inativo / Expirado" : "Ativo"}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end">
                                 <div className="flex items-center gap-1.5 text-slate-400">
                                    <Calendar size={10} />
                                    <span className="text-[10px] font-medium">{new Date(store.createdAt).toLocaleDateString("pt-BR")}</span>
                                 </div>
                                 <a 
                                    href={`https://${store.slug}.pedeue.com`} 
                                    target="_blank" 
                                    className="text-purple-500 hover:text-purple-700 transition-colors mt-1 flex items-center gap-1"
                                 >
                                    <span className="text-[9px] font-black uppercase tracking-tight">Ver Loja</span>
                                    <ExternalLink size={10} />
                                 </a>
                              </div>
                           </td>
                        </tr>
                      );
                    })}
                    {stores.length === 0 && (
                       <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">Você ainda não possui lojistas cadastrados.</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        )}
      </div>
    </div>
  );
}
