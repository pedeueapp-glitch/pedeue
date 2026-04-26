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
  ACTIVE: { label: "Ativa", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  CANCELED: { label: "Cancelada", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle },
  PAST_DUE: { label: "Em atraso", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: Clock },
  TRIALING: { label: "Período de teste", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Clock },
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
        href="/afiliado"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao dashboard
      </Link>

      <div>
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
          <Users className="w-4 h-4" />
          <span>Meus Clientes</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Lojas indicadas</h1>
        <p className="text-gray-400 mt-1 text-sm">
          {stores.length} {stores.length === 1 ? "loja indicada" : "lojas indicadas"} no total
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="w-full pl-10 pr-4 py-3 bg-[#0f0f1a] border border-white/5 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all text-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-[#0f0f1a] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm">Carregando clientes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Nenhuma loja encontrada</p>
            <p className="text-gray-600 text-sm mt-1">
              {search ? "Tente outro termo de busca." : "Você ainda não cadastrou nenhum lojista."}
            </p>
            {!search && (
              <Link
                href="/dashboard/afiliado/prospectar"
                className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
              >
                Cadastrar primeiro lojista
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span className="col-span-4">Loja</span>
              <span className="col-span-3">Plano</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-3">Vencimento</span>
            </div>

            {filtered.map((store) => {
              const sub = store.subscription;
              const status = sub?.status ?? "NO_PLAN";
              const cfg = statusConfig[status] ?? { label: "Sem plano", color: "text-gray-400 bg-gray-400/10 border-gray-400/20", icon: XCircle };
              const StatusIcon = cfg.icon;
              const isExpired = sub ? new Date(sub.expiresAt) < new Date() : true;

              return (
                <div key={store.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/2 transition-colors">
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Store className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{store.name}</p>
                        <p className="text-gray-500 text-xs truncate">{store.user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3">
                    {sub?.plan ? (
                      <div>
                        <p className="text-white text-sm">{sub.plan.name}</p>
                        <p className="text-gray-500 text-xs">{fmt(sub.plan.price)}/mês</p>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-sm">Sem plano</span>
                    )}
                  </div>

                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="col-span-3">
                    {sub ? (
                      <p className={`text-sm ${isExpired ? "text-red-400" : "text-gray-300"}`}>
                        {new Date(sub.expiresAt).toLocaleDateString("pt-BR")}
                        {isExpired && <span className="block text-xs text-red-400">Vencido</span>}
                      </p>
                    ) : (
                      <span className="text-gray-600 text-sm">—</span>
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
