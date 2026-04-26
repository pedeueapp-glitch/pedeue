"use client";

import { useEffect, useState } from "react";
import { Users, Search, Store, CheckCircle2, XCircle, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface StoreClient {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  user: { email: string };
  subscription?: {
    status: string;
    expiresAt: string;
    plan?: { name: string; price: number };
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: "Ativa", color: "text-emerald-600 bg-emerald-50 border-emerald-100", icon: CheckCircle2 },
  CANCELED: { label: "Cancelada", color: "text-red-600 bg-red-50 border-red-100", icon: XCircle },
  PAST_DUE: { label: "Em atraso", color: "text-amber-600 bg-amber-50 border-amber-100", icon: Clock },
  TRIALING: { label: "Teste (3 Dias)", color: "text-blue-600 bg-blue-50 border-blue-100", icon: Clock },
};

export default function ClientesPage() {
  const [stores, setStores] = useState<StoreClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/afiliado/clientes")
      .then((r) => r.json())
      .then((d) => setStores(d.stores ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/painel-afiliado"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-widest transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao dashboard
      </Link>

      <div>
        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mb-2">
          <Users className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Meus Clientes</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Lojas indicadas</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          {stores.length} {stores.length === 1 ? "loja indicada" : "lojas indicadas"} no total
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm font-semibold shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest">Carregando clientes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Nenhuma loja encontrada</p>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-2 font-black">
              {search ? "Tente outro termo de busca." : "Você ainda não cadastrou nenhum lojista."}
            </p>
            {!search && (
              <Link
                href="/painel-afiliado/prospectar"
                className="inline-block mt-4 px-6 py-3 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
              >
                Cadastrar primeiro lojista
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
              <span className="col-span-4">Loja</span>
              <span className="col-span-3">Plano</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-3">Vencimento</span>
            </div>

            {filtered.map((store) => {
              const sub = store.subscription;
              const status = sub?.status ?? "NO_PLAN";
              const cfg = statusConfig[status] ?? { label: "Sem plano", color: "text-slate-500 bg-slate-50 border-slate-200", icon: XCircle };
              const StatusIcon = cfg.icon;
              const isExpired = sub ? new Date(sub.expiresAt) < new Date() : true;

              return (
                <div key={store.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-50 transition-colors">
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Store className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-900 text-sm font-bold truncate">{store.name}</p>
                        <p className="text-slate-500 text-[10px] font-semibold truncate">{store.user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3">
                    {sub?.plan ? (
                      <div>
                        <p className="text-slate-900 text-sm font-bold">{sub.plan.name}</p>
                        <p className="text-slate-500 text-[10px] font-semibold">{fmt(sub.plan.price)}/mês</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sem plano</span>
                    )}
                  </div>

                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="col-span-3">
                    {sub ? (
                      <p className={`text-sm font-bold ${isExpired ? "text-red-600" : "text-slate-700"}`}>
                        {new Date(sub.expiresAt).toLocaleDateString("pt-BR")}
                        {isExpired && <span className="block text-[10px] font-black uppercase tracking-widest text-red-500">Vencido</span>}
                      </p>
                    ) : (
                      <span className="text-slate-400 text-sm">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
