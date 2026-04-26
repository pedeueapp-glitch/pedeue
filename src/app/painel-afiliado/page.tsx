"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Store,
  CheckCircle2,
  DollarSign,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalStores: number;
  activeStores: number;
  totalReceived: number;
  pendingBalance: number;
  commissionRate: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 group hover:shadow-md transition-all">
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-slate-800 text-2xl font-black">{value}</p>
        {sub && <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-tighter">{sub}</p>}
      </div>
    </div>
  );
}

export default function AffiliateDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/afiliado/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Painel do Afiliado</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Seu desempenho como parceiro</h1>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Acompanhe suas lojas ativas e comissões recorrentes.
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Store}
            label="Total de Lojas"
            value={String(data?.totalStores ?? 0)}
            sub="Indicadas por você"
            color="bg-blue-500"
            gradient="bg-gradient-to-br from-blue-500/5 to-transparent"
          />
          <StatCard
            icon={CheckCircle2}
            label="Lojas Ativas"
            value={String(data?.activeStores ?? 0)}
            sub="Assinatura em dia"
            color="bg-emerald-500"
            gradient="bg-gradient-to-br from-emerald-500/5 to-transparent"
          />
          <StatCard
            icon={Clock}
            label="Saldo Pendente"
            value={fmt(data?.pendingBalance ?? 0)}
            sub="Próximo repasse"
            color="bg-amber-500"
            gradient="bg-gradient-to-br from-amber-500/5 to-transparent"
          />
          <StatCard
            icon={DollarSign}
            label="Total Recebido"
            value={fmt(data?.totalReceived ?? 0)}
            sub="Histórico total"
            color="bg-purple-500"
            gradient="bg-gradient-to-br from-purple-500/5 to-transparent"
          />
        </div>
      )}

      {/* Commission Info */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-emerald-900 font-black text-lg mb-1 tracking-tight">
              Sua comissão vitalícia é de{" "}
              <span className="text-emerald-600">
                {((data?.commissionRate ?? 0.1) * 100).toFixed(0)}%
              </span>
            </h3>
            <p className="text-emerald-700/70 text-sm font-medium leading-relaxed">
              Cada vez que um lojista indicado por você renovar a assinatura, você recebe automaticamente o percentual sobre o valor pago. Sem limites de indicação e sem prazo de expiração.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-slate-800 font-black text-sm uppercase tracking-widest mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Novo Lojista", href: "/painel-afiliado/prospectar", desc: "Criar loja vinculada ao seu perfil", color: "from-emerald-500 to-teal-600" },
            { label: "Meus Clientes", href: "/painel-afiliado/clientes", desc: "Ver status das lojas indicadas", color: "from-blue-500 to-indigo-600" },
            { label: "Financeiro", href: "/painel-afiliado/financeiro", desc: "Extrato e saldos a receber", color: "from-purple-500 to-violet-600" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg transition-all"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <p className="text-slate-900 text-sm font-black mb-1">{action.label}</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
