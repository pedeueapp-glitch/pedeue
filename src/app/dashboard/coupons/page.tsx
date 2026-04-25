"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { 
  Tag, Plus, Percent, DollarSign, Calendar, Trash2, ToggleLeft, 
  ToggleRight, Loader2, RefreshCw, X, Check, Hash, Package, Users
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  isCashback: boolean;
  expiryDate: string | null;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons]   = useState<Coupon[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [activeTab, setActiveTab] = useState<"COUPONS" | "CASHBACK">("COUPONS");

  const [form, setForm] = useState({
    code: "",
    type: "PERCENT" as "PERCENT" | "FIXED",
    value: "",
    minOrderValue: "0",
    maxUses: "0",
    expiryDate: "",
    isActive: true,
    isCashback: false,
  });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/coupons");
      const data = await res.json();
      if (Array.isArray(data)) setCoupons(data);
    } catch { toast.error("Erro ao carregar cupons"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.value) return toast.error("Preencha todos os campos obrigatórios");
    setSaving(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isCashback: activeTab === "CASHBACK" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Cupom criado com sucesso!");
      setShowModal(false);
      setForm({ code: "", type: "PERCENT", value: "", minOrderValue: "0", maxUses: "0", expiryDate: "", isActive: true, isCashback: false });
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar cupom");
    } finally { setSaving(false); }
  };

  const toggleCoupon = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/coupons?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current })
      });
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !current } : c));
    } catch { toast.error("Erro ao atualizar"); }
  };

  const deleteCoupon = async (id: string) => {
    if (!window.confirm("Deseja excluir este cupom?")) return;
    try {
      await fetch(`/api/coupons?id=${id}`, { method: "DELETE" });
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success("Cupom excluído");
    } catch { toast.error("Erro ao excluir"); }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm(p => ({ ...p, code }));
  };

  const filtered = coupons.filter(c => activeTab === "CASHBACK" ? c.isCashback : !c.isCashback);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header title="Cupons & Cashback" />

      <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
        
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            <button onClick={() => setActiveTab("COUPONS")} className={`px-5 py-2.5 rounded-lg text-xs font-black  tracking-widest transition-all flex items-center gap-2 ${activeTab === "COUPONS" ? "bg-purple-500 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}>
              <Tag size={14} /> Cupons
            </button>
            <button onClick={() => setActiveTab("CASHBACK")} className={`px-5 py-2.5 rounded-lg text-xs font-black  tracking-widest transition-all flex items-center gap-2 ${activeTab === "CASHBACK" ? "bg-purple-500 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}>
              <RefreshCw size={14} /> Cashback
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-purple-500 text-white rounded-xl font-black  tracking-widest text-xs shadow-lg shadow-purple-500/20 hover:bg-purple-600 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Novo {activeTab === "CASHBACK" ? "Cashback" : "Cupom"}
          </button>
        </div>

        {/* MÉTRICAS RÁPIDAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total de Cupons", value: filtered.length, icon: Tag, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "Cupons Ativos", value: filtered.filter(c => c.isActive).length, icon: Check, color: "text-green-500", bg: "bg-green-50" },
            { label: "Total de Usos", value: filtered.reduce((s, c) => s + c.usedCount, 0), icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400  tracking-tight">{stat.label}</p>
                <p className="text-xl font-black text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* TABELA DE CUPONS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            {activeTab === "CASHBACK" ? <RefreshCw size={16} className="text-purple-500" /> : <Tag size={16} className="text-purple-500" />}
            <h3 className="text-xs font-black text-slate-700  tracking-widest">
              {activeTab === "CASHBACK" ? "Regras de Cashback" : "Lista de Cupons"}
            </h3>
          </div>

          {loading ? (
            <div className="py-16 text-center"><Loader2 className="animate-spin text-purple-500 mx-auto" size={24} /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Tag className="mx-auto text-slate-200" size={40} />
              <p className="text-slate-400 text-xs font-bold ">Nenhum {activeTab === "CASHBACK" ? "cashback" : "cupom"} cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400  tracking-widest bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Desconto</th>
                    <th className="px-6 py-4">Pedido Mín.</th>
                    <th className="px-6 py-4">Usos</th>
                    <th className="px-6 py-4">Validade</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(coupon => (
                    <tr key={coupon.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-black text-xs tracking-widest font-mono">
                            {coupon.code}
                          </div>
                          {coupon.isCashback && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black  rounded border border-purple-100">Cashback</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-xs font-black text-slate-700">
                          {coupon.type === "PERCENT" ? (
                            <><Percent size={12} className="text-purple-500" /> {coupon.value}%</>
                          ) : (
                            <><DollarSign size={12} className="text-green-500" /> R$ {coupon.value.toFixed(2)}</>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {coupon.minOrderValue > 0 ? `R$ ${coupon.minOrderValue.toFixed(2)}` : "Sem mínimo"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-slate-700">{coupon.usedCount}</span>
                        {coupon.maxUses > 0 && <span className="text-slate-400 text-[10px] font-bold"> / {coupon.maxUses}</span>}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {coupon.expiryDate ? format(new Date(coupon.expiryDate), "dd/MM/yyyy") : "Sem prazo"}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleCoupon(coupon.id, coupon.isActive)} className="flex items-center gap-1.5 transition-all">
                          {coupon.isActive ? (
                            <><ToggleRight size={22} className="text-green-500" /><span className="text-[9px] font-black text-green-600 ">Ativo</span></>
                          ) : (
                            <><ToggleLeft size={22} className="text-slate-400" /><span className="text-[9px] font-black text-slate-400 ">Inativo</span></>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => deleteCoupon(coupon.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NOVO CUPOM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Tag size={16} className="text-white" />
                </div>
                <h3 className="font-black text-slate-800 text-sm  tracking-widest">
                  Criar {activeTab === "CASHBACK" ? "Cashback" : "Cupom"}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* CÓDIGO */}
              <div>
                <label className="text-[10px] font-black text-slate-400  tracking-widest block mb-2">Código do Cupom *</label>
                <div className="flex gap-2">
                  <input
                    required
                    value={form.code}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="Ex: PROMO20"
                    className="flex-1 input-field font-mono  font-black tracking-widest"
                  />
                  <button type="button" onClick={generateCode} className="px-3 py-2.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all border border-slate-200 text-[10px] font-black ">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* TIPO + VALOR */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400  tracking-widest block mb-2">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                    className="input-field"
                  >
                    <option value="PERCENT">Percentual (%)</option>
                    <option value="FIXED">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400  tracking-widest block mb-2">
                    Valor * {form.type === "PERCENT" ? "(%)" : "(R$)"}
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.value}
                    onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                    placeholder={form.type === "PERCENT" ? "10" : "5.00"}
                    className="input-field"
                  />
                </div>
              </div>

              {/* PEDIDO MÍNIMO + LIMITE DE USOS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400  tracking-widest block mb-2">Pedido Mínimo (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minOrderValue}
                    onChange={e => setForm(p => ({ ...p, minOrderValue: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400  tracking-widest block mb-2">Limite de Usos</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxUses}
                    onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                    placeholder="0 = ilimitado"
                    className="input-field"
                  />
                </div>
              </div>

              {/* VALIDADE */}
              <div>
                <label className="text-[10px] font-black text-slate-400  tracking-widest block mb-2">Data de Validade</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))}
                    className="input-field pl-11"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1 ml-1">Deixe em branco para nunca expirar</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-xs  border border-slate-200 hover:bg-slate-100 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-[2] py-3 bg-purple-500 text-white rounded-xl font-black text-xs  shadow hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Tag size={14} />}
                  Criar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
