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
    <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-white p-5 group hover:shadow-sm transition-all">
      <div className="relative">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color} text-white`}>
          <Icon size={18} />
        </div>
        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-slate-800 text-xl font-black">{value}</p>
        {sub && <p className="text-slate-400 text-[9px] font-medium mt-1">{sub}</p>}
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
    <div className="max-w-6xl mx-auto space-y-6 pt-6 px-4 animate-in fade-in duration-500">
      {/* Header Compacto */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-purple-600 text-[9px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portal do Parceiro</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard de Afiliado</h1>
          <p className="text-slate-400 text-xs font-medium">Acompanhe suas indicações e ganhos recorrentes.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Comissão Fixa</p>
              <p className="text-lg font-black text-slate-700">R$ {(data?.commissionRate ?? 10.0).toFixed(2).replace('.', ',')} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Vitalício</span></p>
           </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Store}
            label="Total de Lojas"
            value={String(data?.totalStores ?? 0)}
            sub="Lojas cadastradas"
            color="bg-purple-500"
          />
          <StatCard
            icon={CheckCircle2}
            label="Lojas Ativas"
            value={String(data?.activeStores ?? 0)}
            sub="Assinaturas pagas"
            color="bg-blue-500"
          />
          <StatCard
            icon={Clock}
            label="Saldo Pendente"
            value={fmt(data?.pendingBalance ?? 0)}
            sub="Aguardando repasse"
            color="bg-amber-500"
          />
          <StatCard
            icon={DollarSign}
            label="Total Recebido"
            value={fmt(data?.totalReceived ?? 0)}
            sub="Ganhos totais"
            color="bg-emerald-500"
          />
        </div>
      )}

      {/* Atalhos Rápidos */}
      <div className="space-y-4">
        <h2 className="text-slate-800 font-bold text-[10px] uppercase tracking-widest ml-1">Menu de Operações</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-10">
          {[
            { label: "Novo Lojista", href: "/dashboard/afiliado/prospectar", desc: "Cadastrar nova loja", color: "bg-purple-50", text: "text-purple-600", icon: Store },
            { label: "Minha Rede", href: "/dashboard/afiliado/clientes", desc: "Ver status das lojas", color: "bg-blue-50", text: "text-blue-600", icon: Users },
            { label: "Financeiro", href: "/dashboard/afiliado/financeiro", desc: "Extrato de comissões", color: "bg-emerald-50", text: "text-emerald-600", icon: DollarSign },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border border-slate-100 bg-white p-6 hover:border-purple-200 transition-all duration-300 relative"
            >
              <div className={`w-10 h-10 rounded-lg ${action.color} ${action.text} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                <action.icon size={20} />
              </div>
              <p className="text-slate-800 text-base font-black mb-0.5">{action.label}</p>
              <p className="text-slate-400 text-[10px] font-medium">{action.desc}</p>
              <ArrowRight className="absolute top-6 right-6 text-slate-200 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" size={18} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
