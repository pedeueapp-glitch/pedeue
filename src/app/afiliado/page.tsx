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
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f0f1a] p-6 group hover:border-white/10 transition-all">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
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
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Painel do Afiliado</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Seu painel de desempenho</h1>
        <p className="text-gray-400 mt-1">
          Acompanhe suas lojas ativas e ganhos em tempo real.
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
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
            sub="Com assinatura em dia"
            color="bg-emerald-500"
            gradient="bg-gradient-to-br from-emerald-500/5 to-transparent"
          />
          <StatCard
            icon={Clock}
            label="Saldo Pendente"
            value={fmt(data?.pendingBalance ?? 0)}
            sub="A ser pago"
            color="bg-amber-500"
            gradient="bg-gradient-to-br from-amber-500/5 to-transparent"
          />
          <StatCard
            icon={DollarSign}
            label="Total Recebido"
            value={fmt(data?.totalReceived ?? 0)}
            sub="Histórico acumulado"
            color="bg-purple-500"
            gradient="bg-gradient-to-br from-purple-500/5 to-transparent"
          />
        </div>
      )}

      {/* Commission Info */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">
              Sua comissão é de{" "}
              <span className="text-emerald-400">
                {((data?.commissionRate ?? 0.1) * 100).toFixed(0)}% vitalícia
              </span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Cada vez que um lojista que você indicou pagar a mensalidade, você recebe automaticamente{" "}
              {((data?.commissionRate ?? 0.1) * 100).toFixed(0)}% do valor. Quanto mais lojas ativas, mais
              você ganha — todo mês, para sempre.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-white font-semibold mb-4">Ações rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Cadastrar novo lojista", href: "/afiliado/prospectar", desc: "Crie uma loja e vincule ao seu perfil", color: "from-emerald-500 to-teal-600" },
            { label: "Ver meus clientes", href: "/afiliado/clientes", desc: "Acompanhe o status das lojas indicadas", color: "from-blue-500 to-indigo-600" },
            { label: "Ver financeiro", href: "/afiliado/financeiro", desc: "Extrato de comissões e saldo pendente", color: "from-purple-500 to-violet-600" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border border-white/5 bg-[#0f0f1a] p-5 hover:border-white/10 transition-all hover:-translate-y-0.5"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
              <p className="text-white text-sm font-semibold mb-1">{action.label}</p>
              <p className="text-gray-500 text-xs">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
