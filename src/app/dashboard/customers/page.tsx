"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, Edit3, Trash2, Loader2, X,
  User, Phone, MapPin, ClipboardList
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "", phone: "", street: "", number: "", neighborhood: "", city: ""
  });
  const [storeId, setStoreId] = useState<string | null>(null);

  function maskPhone(value: string) {
    let val = value.replace(/\D/g, "");
    val = val.substring(0, 11);
    
    let formatted = val;
    if (val.length > 0) formatted = "(" + val;
    if (val.length > 2) formatted = "(" + val.substring(0, 2) + ") " + val.substring(2);
    if (val.length > 7) formatted = formatted.substring(0, 10) + "-" + formatted.substring(10);
    
    return formatted;
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, storeRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/store")
      ]);
      const data = await custRes.json();
      const storeData = await storeRes.json();
      setCustomers(Array.isArray(data) ? data : []);
      setStoreId(storeData?.id || null);
    } catch { toast.error("Erro ao carregar"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCustomer ? "PATCH" : "POST";
    const url = "/api/customers";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCustomer 
          ? { ...formData, id: editingCustomer.id, storeId } 
          : { ...formData, storeId }
        ),
      });
      if (!res.ok) throw new Error();
      toast.success("Cliente salvo!");
      setIsModalOpen(false);
      fetchData();
    } catch { toast.error("Erro ao salvar"); }
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      const res = await fetch(`/api/customers?id=${customerToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Cliente removido");
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      fetchData();
    } catch { toast.error("Erro ao remover"); }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <>
      <Header title="Gestão de Clientes" />

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Meus Clientes</h2>
            <p className="text-slate-400 text-sm mt-1">Lista de clientes cadastrados no sistema.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Nome ou Telefone..."
                className="input-field pl-11 !rounded-2xl"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                setEditingCustomer(null);
                setFormData({ name: "", phone: "", street: "", number: "", neighborhood: "", city: "" });
                setIsModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2 !py-3.5 !rounded-2xl"
            >
              <Plus size={18} />
              <span>Novo Cliente</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
            <span className="font-black  tracking-widest text-[10px] text-slate-400">Carregando...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="card-premium p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{customer.name}</h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <Phone size={12} className="text-slate-300" />
                        {customer.phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingCustomer(customer); setFormData({ ...customer }); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-purple-500 transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => { setCustomerToDelete(customer.id); setIsDeleteModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-50">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-slate-300 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {customer.street}, {customer.number} - {customer.neighborhood}, {customer.city}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex justify-end">
                   <button 
                    onClick={() => window.location.href = `/dashboard/pdv?customerId=${customer.id}`}
                    className="flex items-center gap-2 text-[10px] font-black  text-purple-500 hover:text-purple-600 transition-colors"
                   >
                     <ClipboardList size={14} />
                     Novo Orçamento
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-lg rounded-[40px] p-8 lg:p-12 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-2xl font-bold text-navy">{editingCustomer ? "Editar Cliente" : "Novo Cliente"}</h2>
                <p className="text-slate-400 text-xs mt-1 font-medium">Informações básicas do cliente.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><X size={20}/></button>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Nome</label>
                  <input className="input-field" placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Telefone / WhatsApp</label>
                  <input 
                    className="input-field" 
                    placeholder="55 (11) 99999-9999" 
                    value={maskPhone(formData.phone)} 
                    onChange={e => {
                        setFormData({...formData, phone: e.target.value.replace(/\D/g, "").substring(0, 11)});
                    }} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Endereço (Rua)</label>
                <input className="input-field" placeholder="Rua..." value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Número</label>
                  <input className="input-field" placeholder="123" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Bairro</label>
                  <input className="input-field" placeholder="Bairro..." value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Cidade</label>
                <input className="input-field" placeholder="Cidade..." value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
            </div>

            <button type="submit" className="w-full btn-primary py-4.5 mt-10 rounded-2xl shadow-xl shadow-purple-500/20">
              {editingCustomer ? "Salvar Alterações" : "Cadastrar Cliente"}
            </button>
          </form>
        </div>
      )}

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Cliente?"
        message="Esta ação não pode ser desfeita e removerá o histórico deste cliente."
        confirmText="Excluir Agora"
      />
    </>
  );
}
