"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  TrendingUp,
  Receipt,
} from "lucide-react";
import toast from "react-hot-toast";

import { Header } from "@/components/Header";

export default function AffiliateFinancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/afiliado/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => toast.error("Erro ao carregar dados financeiros"))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Header title="Financeiro" />
      
      <div className="max-w-6xl mx-auto w-full space-y-6 pt-6 px-4 animate-in fade-in duration-500">
      {/* Header Compacto */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Extrato Financeiro</h1>
          <p className="text-slate-400 text-xs font-medium">Gestão de comissões e repasses PIX.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
             <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Total Liquidado</p>
             <p className="text-lg font-black text-emerald-700">{fmt(data?.totalReceived ?? 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumo Lateral */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Resumo de Saldos</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aguardando Repasse</p>
                  <p className="text-base font-black text-slate-700">{fmt(data?.pendingBalance ?? 0)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxa de Comissão</p>
                  <p className="text-base font-black text-slate-700">R$ {(data?.commissionRate ?? 10).toFixed(2)} / loja</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
               <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Receipt size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Regra de Pagamento</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    As comissões são liquidadas automaticamente via PIX após a confirmação do pagamento da mensalidade pelo lojista indicado.
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* Lista de Comissões */}
        <div className="lg:col-span-2 space-y-4">
           <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-50">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Últimas Movimentações</h3>
             </div>

             {loading ? (
                <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
             ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <tr>
                         <th className="px-6 py-4">Lojista / Data</th>
                         <th className="px-6 py-4 text-center">Status</th>
                         <th className="px-6 py-4 text-right">Valor</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {data?.commissions?.map((commission: any) => (
                          <tr key={commission.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-slate-700 text-xs font-bold">{commission.store?.name || "Lojista"}</p>
                              <p className="text-[9px] text-slate-400 font-medium">{new Date(commission.createdAt).toLocaleDateString("pt-BR")}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${commission.status === "PAID" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                                {commission.status === "PAID" ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                {commission.status === "PAID" ? "Pago" : "Pendente"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className={`text-sm font-black ${commission.status === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>
                                {fmt(commission.amount)}
                              </p>
                            </td>
                          </tr>
                        ))}
                        {(!data?.commissions || data.commissions.length === 0) && (
                           <tr>
                             <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">Nenhuma movimentação encontrada.</td>
                           </tr>
                        )}
                     </tbody>
                   </table>
                </div>
             )}
           </div>
        </div>
      </div>
      </div>
    </div>
  );
}
