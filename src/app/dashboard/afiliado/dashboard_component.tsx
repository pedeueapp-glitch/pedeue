"use client";

import { useEffect, useState } from "react";
import {
  Store,
  CheckCircle2,
  DollarSign,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
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
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 group hover:shadow-md transition-all">
      <div className="relative">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color} text-white shadow-lg shadow-inherit/20`}>
          <Icon size={22} />
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-slate-800 text-2xl font-black">{value}</p>
        {sub && <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-tighter">{sub}</p>}
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
      .catch(err => console.error("Erro ao buscar dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header com estilo padronizado */}
      <div className="bg-white p-8 lg:p-12 rounded-[48px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-600 text-[10px] font-black uppercase tracking-widest mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Portal do Parceiro</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Olá, seu desempenho hoje</h1>
          <p className="text-slate-400 text-sm font-medium">Acompanhe suas lojas ativas e comissões recorrentes em tempo real.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-purple-50 p-6 rounded-[32px] border border-purple-100">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Sua Comissão Fixa</p>
              <p className="text-2xl font-black text-purple-600 tracking-tight">R$ {(data?.commissionRate ?? 10.0).toFixed(2).replace('.', ',')} <span className="text-xs text-purple-400 font-bold tracking-normal">VITALÍCIO</span></p>
           </div>
        </div>
      </div>

      {/* Stats Cards Padronizados */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-[32px] bg-white border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Store}
            label="Total de Lojas"
            value={String(data?.totalStores ?? 0)}
            sub="Indicadas por você"
            color="bg-purple-500"
          />
          <StatCard
            icon={CheckCircle2}
            label="Lojas Ativas"
            value={String(data?.activeStores ?? 0)}
            sub="Assinatura em dia"
            color="bg-blue-500"
          />
          <StatCard
            icon={Clock}
            label="Saldo Pendente"
            value={fmt(data?.pendingBalance ?? 0)}
            sub="Próximo repasse"
            color="bg-amber-500"
          />
          <StatCard
            icon={DollarSign}
            label="Total Recebido"
            value={fmt(data?.totalReceived ?? 0)}
            sub="Histórico total"
            color="bg-emerald-500"
          />
        </div>
      )}

      {/* Quick Actions Reestilizadas */}
      <div className="space-y-6">
        <h2 className="text-slate-800 font-black text-xs uppercase tracking-widest ml-1">Atalhos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-10">
          {[
            { label: "Novo Lojista", href: "/dashboard/afiliado/prospectar", desc: "Cadastrar loja vinculada", color: "bg-purple-500", icon: Store },
            { label: "Meus Clientes", href: "/dashboard/afiliado/clientes", desc: "Status das indicações", color: "bg-blue-500", icon: Users },
            { label: "Financeiro", href: "/dashboard/afiliado/financeiro", desc: "Extrato de comissões", color: "bg-emerald-500", icon: DollarSign },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-[40px] border border-slate-100 bg-white p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 relative overflow-hidden"
            >
              <div className={`w-14 h-14 rounded-2xl ${action.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-inherit/20`}>
                <action.icon size={24} />
              </div>
              <p className="text-slate-800 text-lg font-black mb-1">{action.label}</p>
              <p className="text-slate-400 text-xs font-bold tracking-tight">{action.desc}</p>
              <ArrowRight className="absolute bottom-8 right-8 text-slate-200 group-hover:text-purple-500 group-hover:translate-x-2 transition-all" size={24} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
