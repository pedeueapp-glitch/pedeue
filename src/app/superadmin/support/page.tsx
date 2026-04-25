"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Filter,
  User,
  ShoppingBag,
  Loader2,
  LifeBuoy
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { SupportChat } from "@/components/support/SupportChat";

export default function SuperAdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL"); // ALL, OPEN, IN_PROGRESS, CLOSED

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Erro ao carregar chamados");
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success("Status atualizado!");
        fetchTickets();
      }
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const filteredTickets = tickets.filter(t => filter === "ALL" || t.status === filter);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50/50">
       <Loader2 className="animate-spin text-purple-500" />
    </div>
  );

  if (selectedTicketId) {
    const ticket = tickets.find(t => t.id === selectedTicketId);
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        <Header title={`Atendimento #${selectedTicketId.slice(-6).toUpperCase()}`} />
        
        <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                   setSelectedTicketId(null);
                   fetchTickets();
                }}
                className="p-3 hover:bg-white rounded-2xl transition-colors border border-slate-100 shadow-sm"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{ticket?.subject}</h1>
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-bold text-slate-400  tracking-widest">Loja: {ticket?.store?.name || "Sem Loja"}</p>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <p className="text-[10px] font-bold text-slate-400  tracking-widest">Usuário: {ticket?.user?.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <label className="text-[10px] font-bold text-slate-400  tracking-widest mr-2 hidden sm:block">Mudar Status:</label>
               <select 
                 value={ticket?.status}
                 onChange={(e) => updateTicketStatus(ticket!.id, e.target.value)}
                 className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-purple-500/20"
               >
                  <option value="OPEN">Pendente</option>
                  <option value="IN_PROGRESS">Respondido</option>
                  <option value="CLOSED">Finalizado</option>
               </select>
            </div>
          </div>

          <div className="flex-1 min-h-0 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
             <SupportChat ticketId={selectedTicketId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
      <Header title="Central de Atendimento" />

      <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full space-y-8">
        
        {/* TAB FILTERS */}
        <div className="flex bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm w-full sm:w-fit overflow-x-auto no-scrollbar">
           {[
             { id: 'ALL', label: 'Todos' },
             { id: 'OPEN', label: 'Pendentes' },
             { id: 'IN_PROGRESS', label: 'Em Atendimento' },
             { id: 'CLOSED', label: 'Finalizados' },
           ].map(f => (
             <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black  tracking-widest transition-all whitespace-nowrap ${filter === f.id ? 'bg-navy text-white shadow-lg' : 'text-slate-400 hover:text-navy'}`}
             >
                {f.label}
             </button>
           ))}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-[40px] border border-slate-100 p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                 <LifeBuoy size={40} className="text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Nenhum chamado nesta categoria</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2">
                Bom trabalho! Não existem chamados pendentes para este filtro.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className="group bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-purple-100 transition-all text-left flex items-center gap-6"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    ticket.status === 'OPEN' ? 'bg-amber-50 text-amber-500' : 
                    ticket.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-500' : 
                    'bg-emerald-50 text-emerald-500'
                  }`}>
                    {ticket.status === 'OPEN' ? <AlertCircle size={28} /> : 
                     ticket.status === 'IN_PROGRESS' ? <Clock size={28} /> : 
                     <CheckCircle2 size={28} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black text-slate-300  tracking-widest">#{ticket.id.slice(-6).toUpperCase()}</span>
                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span className={`text-[9px] font-black  tracking-widest ${
                        ticket.priority === 'URGENT' ? 'text-red-500' : 'text-slate-400'
                      }`}>Prioridade {ticket.priority}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 line-clamp-1 group-hover:text-purple-600 transition-colors">
                      {ticket.subject}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="text-xs text-slate-500 font-bold">{ticket.store?.name || ticket.user?.name}</span>
                       <span className="text-xs text-slate-300">•</span>
                       <span className="text-xs text-slate-400 font-medium">Atualizado {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black  tracking-widest ${
                       ticket.status === 'OPEN' ? 'bg-amber-50 text-amber-600' : 
                       ticket.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 
                       'bg-emerald-50 text-emerald-600'
                     }`}>
                       {ticket.status === 'OPEN' ? 'Pendente' : ticket.status === 'IN_PROGRESS' ? 'Respondido' : 'Concluído'}
                     </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
