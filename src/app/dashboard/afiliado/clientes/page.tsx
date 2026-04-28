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
  TRIALING: { label: "Teste", color: "text-blue-600 bg-blue-50 border-blue-100", icon: Clock },
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
            <Users className="w-4 h-4" />
            <span>Gestão de Parceiros</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Minhas Indicações</h1>
          <p className="text-slate-400 text-sm font-medium">Você possui {stores.length} lojas vinculadas ao seu perfil.</p>
        </div>

        <Link
          href="/dashboard/afiliado/prospectar"
          className="bg-purple-500 text-white px-8 py-4 rounded-[24px] text-xs font-black tracking-widest hover:bg-purple-600 transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-3"
        >
          <Store size={18} />
          PROSPECTAR NOVA LOJA
        </Link>
      </div>

      {/* Search Padronizado */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar lojista por nome, domínio ou email..."
          className="w-full pl-16 pr-8 py-6 bg-white border border-slate-100 rounded-[32px] text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-purple-500/5 focus:border-purple-500 transition-all text-sm font-bold shadow-sm"
        />
      </div>

      {/* Tabela Padronizada */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando lojistas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto">
               <Store className="w-10 h-10 text-slate-200" />
            </div>
            <div>
              <p className="text-slate-800 font-black text-lg">Nenhuma loja encontrada</p>
              <p className="text-slate-400 text-sm font-medium mt-1">
                {search ? "Tente ajustar os filtros de busca." : "Comece a prospectar para ver suas lojas aqui."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <th className="px-8 py-6">Informações da Loja</th>
                     <th className="px-8 py-6">Plano / Valor</th>
                     <th className="px-8 py-6">Status Assinatura</th>
                     <th className="px-8 py-6">Próximo Vencimento</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filtered.map((store) => {
                    const sub = store.subscription;
                    const status = sub?.status ?? "NO_PLAN";
                    const cfg = statusConfig[status] ?? { label: "Sem plano", color: "text-slate-400 bg-slate-50 border-slate-100", icon: XCircle };
                    const StatusIcon = cfg.icon;
                    const isExpired = sub ? new Date(sub.expiresAt) < new Date() : true;

                    return (
                      <tr key={store.id} className="hover:bg-slate-50/30 transition-all">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center flex-shrink-0">
                              <Store className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-slate-800 text-sm font-black tracking-tight">{store.name}</p>
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">{store.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {sub?.plan ? (
                            <div>
                              <p className="text-slate-800 text-sm font-black">{sub.plan.name}</p>
                              <p className="text-purple-600 text-[10px] font-black">{fmt(sub.plan.price)} <span className="text-slate-400">/mês</span></p>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">Aguardando</span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${cfg.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          {sub ? (
                            <div>
                              <p className={`text-sm font-black ${isExpired ? "text-red-500" : "text-slate-700"}`}>
                                {new Date(sub.expiresAt).toLocaleDateString("pt-BR")}
                              </p>
                              {isExpired && <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Inadimplente</span>}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
