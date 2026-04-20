"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Settings, 
  Trash2,
  Users,
  Search,
  Loader2,
  Shield,
  Store
} from "lucide-react";
import toast from "react-hot-toast";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    role: "USER"
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar usuários");
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (user?: any) => {
    if (user) {
      setSelectedUser(user);
      setForm({
        id: user.id,
        name: user.name,
        email: user.email,
        password: "", // Senha fica vazia na edição se não for mudar
        role: user.role
      });
    } else {
      setSelectedUser(null);
      setForm({ id: "", name: "", email: "", password: "", role: "USER" });
    }
    setIsModalOpen(true);
  };

  async function saveUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = selectedUser ? `/api/superadmin/users/${selectedUser.id}` : "/api/superadmin/users";
      const method = selectedUser ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erro ao salvar usuário");
      }

      toast.success(selectedUser ? "Usuário atualizado!" : "Usuário criado!");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    
    try {
      const res = await fetch(`/api/superadmin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Erro ao excluir");
      
      toast.success("Usuário removido!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar mode="SUPERADMIN" />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header title="Gestão de Usuários" />

        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                className="input-field !pl-12 !h-12 !rounded-2xl"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <button 
              onClick={() => handleOpenModal()}
              className="btn-primary !px-6 flex items-center gap-2 !h-12 !rounded-2xl shadow-lg shadow-orange-500/20"
            >
              <Plus size={18} /> Novo Usuário
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-20">
              <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
              <p className="font-black uppercase tracking-widest text-xs">Carregando usuários...</p>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nível</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loja Vinculada</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-12">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-500 transition-all">
                               <Users size={18} />
                            </div>
                            <div>
                               <div className="font-black text-slate-800 uppercase text-xs">{user.name}</div>
                               <div className="text-[10px] text-slate-400 font-bold lowercase tracking-tighter">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                           <div className="flex justify-center">
                             <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.role === 'SUPERADMIN' ? "bg-purple-50 text-purple-600 border-purple-200" : user.role === 'ADMIN' ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                                {user.role === 'SUPERADMIN' && <Shield size={10} />}
                                {user.role}
                             </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           {user.store ? (
                             <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                               <Store size={14} className="text-orange-500" />
                               {user.store.name}
                               <span className="text-[9px] text-slate-400 font-bold ml-1">/{user.store.slug}</span>
                             </div>
                           ) : (
                             <span className="text-[10px] font-bold text-slate-300 italic-none">Nenhuma loja vinculada</span>
                           )}
                        </td>
                        <td className="px-8 py-6 text-right pr-12">
                          <div className="flex justify-end gap-2">
                             <button 
                               onClick={() => handleOpenModal(user)}
                               className="p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-2xl transition-all border border-transparent hover:border-orange-100"
                             >
                               <Settings size={20} />
                             </button>
                             <button 
                               onClick={() => deleteUser(user.id)}
                               className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                             >
                               <Trash2 size={20} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: GERENCIAR USUÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={saveUser} className="bg-white rounded-[48px] w-full max-w-md p-10 lg:p-14 shadow-2xl flex flex-col">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                {selectedUser ? "Configurar Usuário" : "Novo Usuário"}
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Defina permissões e acessos</p>
            </div>
            
            <div className="space-y-5 mb-10 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                <input className="input-field" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail de Acesso</label>
                <input type="email" className="input-field" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  {selectedUser ? "Nova Senha (deixar vazio para manter)" : "Senha de Acesso"}
                </label>
                <input type="password" className="input-field" required={!selectedUser} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nível de Permissão</label>
                <select className="input-field appearance-none" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                   <option value="USER">Usuário (Lojista)</option>
                   <option value="ADMIN">Administrador</option>
                   <option value="SUPERADMIN">SuperAdmin (Controle Total)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1 shadow-sm">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary flex-[2] shadow-orange-500/20">
                {saving ? "Salvando..." : selectedUser ? "Salvar Alterações" : "Criar Usuário"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
