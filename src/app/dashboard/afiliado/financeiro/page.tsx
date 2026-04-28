"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowLeft,
  TrendingUp,
  Receipt,
} from "lucide-react";
import Link from "next/link";

interface Commission {
  id: string;
  storeId: string;
  storeName: string;
  platformTransactionId: string;
  amount: number;
  status: "PENDING" | "PAID";
  paidAt: string | null;
  createdAt: string;
}

interface FinanceData {
  commissions: Commission[];
  totalPaid: number;
  totalPending: number;
}

export default function FinanceiroPage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PAID">("ALL");

  useEffect(() => {
    fetch("/api/afiliado/financeiro")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filtered =
    filter === "ALL"
      ? data?.commissions ?? []
      : (data?.commissions ?? []).filter((c) => c.status === filter);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 text-xs font-bold uppercase tracking-widest transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2 text-purple-600 text-[10px] font-black uppercase tracking-widest mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Gestão de Recebíveis</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Extrato Financeiro</h1>
          <p className="text-slate-400 text-sm font-medium">Controle suas comissões vitalícias e acompanhe seus ganhos.</p>
        </div>

        <div className="flex bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm w-full sm:w-fit overflow-x-auto no-scrollbar">
           {(["ALL", "PENDING", "PAID"] as const).map((f) => (
             <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`flex items-center justify-center gap-3 px-6 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex-1 sm:flex-initial ${filter === f ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-purple-600'}`}
             >
                <span>{f === "ALL" ? "Todos" : f === "PENDING" ? "Pendentes" : "Pagos"}</span>
             </button>
           ))}
        </div>
      </div>

      {/* Summary Cards Padronizados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 flex items-center gap-6 shadow-sm group">
          <div className="w-16 h-16 rounded-[24px] bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
            <Clock size={32} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Saldo a Receber</p>
            <p className="text-3xl font-black text-slate-800 tracking-tighter">{fmt(data?.totalPending ?? 0)}</p>
            <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase">Aguardando repasse mensal</p>
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-100 p-8 flex items-center gap-6 shadow-sm group">
          <div className="w-16 h-16 rounded-[24px] bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Já Recebido</p>
            <p className="text-3xl font-black text-slate-800 tracking-tighter">{fmt(data?.totalPaid ?? 0)}</p>
            <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase">Histórico de lucros acumulados</p>
          </div>
        </div>
      </div>

      {/* Commissions List Padronizada */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando extrato...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto">
               <Receipt className="w-10 h-10 text-slate-200" />
            </div>
            <div>
              <p className="text-slate-800 font-black text-lg">Nenhum registro encontrado</p>
              <p className="text-slate-400 text-sm font-medium mt-1">
                Suas comissões aparecerão aqui conforme as assinaturas forem liquidadas.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <th className="px-8 py-6">Origem (Loja)</th>
                     <th className="px-8 py-6">Data da Transação</th>
                     <th className="px-8 py-6">Status do Repasse</th>
                     <th className="px-8 py-6 text-right">Valor da Comissão</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filtered.map((commission) => (
                    <tr key={commission.id} className="hover:bg-slate-50/30 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <p className="text-slate-800 text-sm font-black tracking-tight">{commission.storeName}</p>
                          <p className="text-slate-400 text-[10px] font-mono tracking-tighter">#{commission.platformTransactionId.slice(-12)}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <p className="text-slate-700 text-sm font-bold">
                            {new Date(commission.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                          {commission.paidAt && (
                            <p className="text-purple-400 text-[9px] font-black uppercase tracking-widest">
                              Liquidado em {new Date(commission.paidAt).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {commission.status === "PAID" ? (
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border text-emerald-600 bg-emerald-50 border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border text-amber-600 bg-amber-50 border-amber-100">
                            <Clock className="w-3.5 h-3.5" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className={`text-xl font-black ${commission.status === "PAID" ? "text-emerald-500" : "text-amber-500"}`}>
                          {fmt(commission.amount)}
                        </p>
                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Comissão Fixa Vitalícia</p>
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
        Os repasses são automáticos via PIX para sua chave cadastrada após a liquidação do lojista.
      </p>
    </div>
  );
}
