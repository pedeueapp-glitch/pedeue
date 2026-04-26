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
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/painel-afiliado"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-widest transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao dashboard
      </Link>

      <div>
        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mb-2">
          <DollarSign className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Financeiro</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Suas comissões</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          Extrato de todas as comissões geradas pelas suas lojas indicadas.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-amber-900/60 text-[10px] font-black uppercase tracking-widest mb-1">Saldo Pendente</p>
            <p className="text-amber-900 text-2xl font-black">{fmt(data?.totalPending ?? 0)}</p>
            <p className="text-amber-700/60 text-[10px] font-bold mt-1 uppercase tracking-tighter">Aguardando repasse</p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-emerald-900/60 text-[10px] font-black uppercase tracking-widest mb-1">Total Recebido</p>
            <p className="text-emerald-900 text-2xl font-black">{fmt(data?.totalPaid ?? 0)}</p>
            <p className="text-emerald-700/60 text-[10px] font-bold mt-1 uppercase tracking-tighter">Histórico acumulado</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["ALL", "PENDING", "PAID"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {f === "ALL" ? "Todos" : f === "PENDING" ? "Pendentes" : "Pagos"}
          </button>
        ))}
      </div>

      {/* Commissions List */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm">Carregando comissões...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Nenhuma comissão encontrada</p>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-2 font-black">
              As comissões aparecem automaticamente quando os lojistas pagam a mensalidade.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
              <span className="col-span-4">Loja</span>
              <span className="col-span-3">Data</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-3 text-right">Valor</span>
            </div>

            {filtered.map((commission) => (
              <div
                key={commission.id}
                className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-50 transition-colors"
              >
                <div className="col-span-4">
                  <p className="text-slate-900 text-sm font-bold">{commission.storeName}</p>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest truncate">#{commission.platformTransactionId.slice(-8)}</p>
                </div>

                <div className="col-span-3">
                  <p className="text-slate-700 text-sm font-semibold">
                    {new Date(commission.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  {commission.paidAt && (
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
                      Pago em {new Date(commission.paidAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  {commission.status === "PAID" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border text-emerald-600 bg-emerald-50 border-emerald-100 uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" />
                      Pago
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border text-amber-600 bg-amber-50 border-amber-100 uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      Pendente
                    </span>
                  )}
                </div>

                <div className="col-span-3 text-right">
                  <p className={`text-lg font-black ${commission.status === "PAID" ? "text-emerald-600" : "text-amber-500"}`}>
                    {fmt(commission.amount)}
                  </p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">10% da mensalidade</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center mt-6">
        Os repasses são realizados via PIX após confirmação dos pagamentos dos lojistas.
      </p>
    </div>
  );
}
