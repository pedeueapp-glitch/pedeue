"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Save, Loader2, Store, Globe, Phone, MapPin } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    whatsapp: "",
    deliveryFee: "0",
    minOrderValue: "0",
    isOpen: true,
    address: "",
    city: "",
    state: "",
    primaryColor: "#f97316",
    slug: ""
  });

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/store");
      const data = await res.json();
      setForm({
        ...data,
        deliveryFee: data.deliveryFee.toString(),
        minOrderValue: data.minOrderValue.toString(),
      });
    } catch {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Configurações da Loja</h2>
        <p className="text-gray-500 text-sm">Personalize a identidade e o funcionamento da sua loja</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-500" />
            Informações Básicas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Nome da Loja</label>
              <input 
                type="text" 
                className="input-field" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp de Pedidos</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  className="input-field !pl-11" 
                  placeholder="Ex: 5511999999999"
                  value={form.whatsapp}
                  onChange={e => setForm({...form, whatsapp: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">URL da Loja (Link)</label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  className="input-field !pl-11 bg-gray-50" 
                  value={form.slug}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Endereço e Delivery
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Endereço Completo</label>
              <input 
                type="text" 
                className="input-field" 
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Taxa de Entrega (R$)</label>
              <input 
                type="number" 
                step="0.01"
                className="input-field" 
                value={form.deliveryFee}
                onChange={e => setForm({...form, deliveryFee: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Pedido Mínimo (R$)</label>
              <input 
                type="number" 
                step="0.01"
                className="input-field" 
                value={form.minOrderValue}
                onChange={e => setForm({...form, minOrderValue: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button 
            type="submit" 
            disabled={saving}
            className="btn-primary !px-12 !py-4 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}
