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
        href="/afiliado"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao dashboard
      </Link>

      <div>
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
          <DollarSign className="w-4 h-4" />
          <span>Financeiro</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Suas comissões</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Extrato de todas as comissões geradas pelas suas lojas indicadas.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-amber-300 text-xs font-medium uppercase tracking-wider mb-1">Saldo Pendente</p>
            <p className="text-white text-2xl font-bold">{fmt(data?.totalPending ?? 0)}</p>
            <p className="text-gray-500 text-xs mt-0.5">Aguardando repasse</p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-300 text-xs font-medium uppercase tracking-wider mb-1">Total Recebido</p>
            <p className="text-white text-2xl font-bold">{fmt(data?.totalPaid ?? 0)}</p>
            <p className="text-gray-500 text-xs mt-0.5">Histórico acumulado</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["ALL", "PENDING", "PAID"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? "bg-emerald-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {f === "ALL" ? "Todos" : f === "PENDING" ? "Pendentes" : "Pagos"}
          </button>
        ))}
      </div>

      {/* Commissions List */}
      <div className="rounded-2xl border border-white/5 bg-[#0f0f1a] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm">Carregando comissões...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Nenhuma comissão encontrada</p>
            <p className="text-gray-600 text-sm mt-1">
              As comissões aparecem automaticamente quando os lojistas pagam a mensalidade.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span className="col-span-4">Loja</span>
              <span className="col-span-3">Data</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-3 text-right">Valor</span>
            </div>

            {filtered.map((commission) => (
              <div
                key={commission.id}
                className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/2 transition-colors"
              >
                <div className="col-span-4">
                  <p className="text-white text-sm font-medium">{commission.storeName}</p>
                  <p className="text-gray-600 text-xs font-mono truncate">#{commission.platformTransactionId.slice(-8)}</p>
                </div>

                <div className="col-span-3">
                  <p className="text-gray-300 text-sm">
                    {new Date(commission.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  {commission.paidAt && (
                    <p className="text-gray-600 text-xs">
                      Pago em {new Date(commission.paidAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  {commission.status === "PAID" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border text-emerald-400 bg-emerald-400/10 border-emerald-400/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Pago
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border text-amber-400 bg-amber-400/10 border-amber-400/20">
                      <Clock className="w-3 h-3" />
                      Pendente
                    </span>
                  )}
                </div>

                <div className="col-span-3 text-right">
                  <p className={`text-lg font-bold ${commission.status === "PAID" ? "text-emerald-400" : "text-amber-400"}`}>
                    {fmt(commission.amount)}
                  </p>
                  <p className="text-gray-600 text-xs">10% da mensalidade</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-gray-600 text-xs text-center">
        Os repasses são realizados via PIX após confirmação dos pagamentos dos lojistas.
      </p>
    </div>
  );
}
