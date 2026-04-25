"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  LifeBuoy,
  Loader2,
  Send,
  BookOpen,
  CheckSquare,
  ChevronRight,
  Zap,
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Truck,
  MessageCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { SupportChat } from "@/components/support/SupportChat";
import Link from "next/link";

export default function MerchantSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("help"); // help, onboarding, list, new
  const [searchQuery, setSearchQuery] = useState("");
  
  // New Ticket Form
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority })
      });

      if (res.ok) {
        toast.success("Chamado aberto com sucesso!");
        setSubject("");
        setMessage("");
        setActiveTab("list");
        fetchTickets();
      } else {
        toast.error("Erro ao abrir chamado");
      }
    } catch (error) {
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    { category: "Começando", questions: [
      { q: "Como configurar meu domínio próprio?", a: "Vá em Configurações > Domínio e siga as instruções de apontamento DNS." },
      { q: "Onde cadastro meu horário de funcionamento?", a: "Em Configurações > Perfil, você encontrará a aba Horários." }
    ]},
    { category: "Pagamentos", questions: [
      { q: "Como ativar o recebimento via PIX?", a: "Acesse Financeiro > Configurações e insira sua chave PIX ou conecte o gateway Efí." },
      { q: "Qual o prazo de recebimento das vendas?", a: "Vendas via PIX caem na hora. Cartão de crédito depende do seu plano no gateway." }
    ]},
    { category: "Pedidos e Entrega", questions: [
      { q: "Como configurar taxas por bairro?", a: "Vá em Configurações > Taxas de Entrega e adicione os valores por região." },
      { q: "Posso integrar com entregadores externos?", a: "Sim, você pode cadastrar entregadores na aba Motoboys para gestão interna." }
    ]}
  ];

  const onboardingSteps = [
    { title: "Perfil da Loja", desc: "Configure logo, nome e endereço", icon: LayoutDashboard, link: "/dashboard/settings", completed: true },
    { title: "Categorias e Produtos", desc: "Cadastre seus primeiros itens", icon: ShoppingBag, link: "/dashboard/products", completed: true },
    { title: "Métodos de Pagamento", desc: "Defina como quer receber", icon: CreditCard, link: "/dashboard/finance", completed: false },
    { title: "Taxas de Entrega", desc: "Configure seus bairros e valores", icon: Truck, link: "/dashboard/delivery-fees", completed: false },
    { title: "WhatsApp Business", desc: "Conecte para avisos automáticos", icon: MessageCircle, link: "/dashboard/settings", completed: false },
  ];

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50/50">
       <Loader2 className="animate-spin text-purple-500" />
    </div>
  );

  if (selectedTicketId) {
    const ticket = tickets.find(t => t.id === selectedTicketId);
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        <Header title={`Chamado #${selectedTicketId.slice(-6).toUpperCase()}`} />
        <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedTicketId(null)} className="p-2 hover:bg-white rounded-lg transition-colors border border-slate-100 shadow-sm">
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{ticket?.subject}</h1>
                <p className="text-[10px] font-bold text-slate-400  tracking-widest">
                  Status: {ticket?.status === 'OPEN' ? 'Aberto' : ticket?.status === 'IN_PROGRESS' ? 'Em Atendimento' : 'Finalizado'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
             <SupportChat ticketId={selectedTicketId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
      <Header title="Suporte e Ajuda" />

      <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full space-y-8">
        
        {/* TAB NAVIGATION */}
        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit">
           {[
             { id: 'help', label: 'Central de Ajuda', icon: BookOpen },
             { id: 'onboarding', label: 'Onboarding', icon: CheckSquare },
             { id: 'list', label: 'Meus Chamados', icon: MessageSquare },
             { id: 'new', label: 'Abrir Chamado', icon: Plus },
           ].map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black  tracking-widest transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`}
             >
                <tab.icon size={16} />
                <span>{tab.label}</span>
             </button>
           ))}
        </div>

        {/* CONTENT SECTIONS */}
        <div className="min-h-[400px]">
          {activeTab === 'help' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  placeholder="Pesquisar por uma dúvida (ex: pix, entrega, domínio)..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-medium text-slate-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredFaqs.map((cat, i) => (
                  <div key={i} className="space-y-4">
                    <h3 className="text-xs font-black text-navy  tracking-widest flex items-center gap-2">
                      <Zap size={14} className="text-amber-500" />
                      {cat.category}
                    </h3>
                    <div className="space-y-3">
                      {cat.questions.map((q, j) => (
                        <details key={j} className="group bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:border-purple-100 transition-colors">
                          <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                            <span className="text-sm font-bold text-slate-700">{q.q}</span>
                            <ChevronRight size={16} className="text-slate-400 group-open:rotate-90 transition-transform" />
                          </summary>
                          <div className="px-4 pb-4 text-xs leading-relaxed text-slate-500 border-t border-slate-50 pt-3">
                            {q.a}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'onboarding' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-2xl font-black mb-2">Quase lá! 🚀</h2>
                  <p className="text-purple-100 text-sm max-w-md mb-6">Complete os passos abaixo para deixar sua loja 100% pronta para vender e encantar seus clientes.</p>
                  
                  <div className="w-full bg-white/20 h-2.5 rounded-full mb-2">
                    <div 
                      className="bg-white h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(onboardingSteps.filter(s => s.completed).length / onboardingSteps.length) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black  tracking-widest text-purple-200">
                    <span>Progresso da Configuração</span>
                    <span>{Math.round((onboardingSteps.filter(s => s.completed).length / onboardingSteps.length) * 100)}%</span>
                  </div>
                </div>
                <Zap className="absolute -right-8 -bottom-8 text-white/10 w-48 h-48" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {onboardingSteps.map((step, i) => (
                  <Link 
                    href={step.link} 
                    key={i}
                    className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-100 transition-all flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${step.completed ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-500'}`}>
                      {step.completed ? <CheckCircle2 size={24} /> : <step.icon size={24} />}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-black  tracking-tight ${step.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">{step.desc}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              {tickets.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                     <LifeBuoy size={48} className="text-slate-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Nenhum chamado aberto</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2">
                    Tudo certo! Você não possui chamados de suporte pendentes no momento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-100 transition-all text-left"
                    >
                      <div className="flex justify-between items-start mb-6">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black  tracking-widest ${
                           ticket.status === 'OPEN' ? 'bg-amber-50 text-amber-600' : 
                           ticket.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 
                           'bg-emerald-50 text-emerald-600'
                         }`}>
                           {ticket.status === 'OPEN' ? 'Pendente' : ticket.status === 'IN_PROGRESS' ? 'Respondido' : 'Concluído'}
                         </span>
                         <span className="text-[9px] font-black text-slate-300  tracking-widest">#{ticket.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors">
                        {ticket.subject}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 flex-1 h-8">
                        {ticket.messages[0]?.content}
                      </p>
                      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              ticket.priority === 'URGENT' ? 'bg-red-500' :
                              ticket.priority === 'HIGH' ? 'bg-orange-500' :
                              'bg-slate-300'
                            }`} />
                            <span className="text-[10px] font-bold text-slate-400  tracking-widest">Prioridade {ticket.priority}</span>
                         </div>
                         <span className="text-[10px] font-bold text-slate-300">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'new' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-10 shadow-sm">
                 <form onSubmit={handleCreateTicket} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">Assunto do Chamado</label>
                          <input 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-600" 
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Ex: Problema no Checkout" 
                            required 
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">Prioridade</label>
                          <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-600 appearance-none"
                            value={priority}
                            onChange={e => setPriority(e.target.value)}
                          >
                            <option value="LOW">Baixa</option>
                            <option value="MEDIUM">Média</option>
                            <option value="HIGH">Alta</option>
                            <option value="URGENT">Urgente</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">Mensagem Detalhada</label>
                       <textarea 
                         className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-600 h-40 resize-none" 
                         value={message}
                         onChange={e => setMessage(e.target.value)}
                         placeholder="Descreva aqui o seu problema ou dúvida..."
                         required
                       />
                    </div>
                    <div className="flex justify-end pt-4">
                       <button 
                         type="submit" 
                         disabled={isSubmitting}
                         className="px-8 py-3.5 bg-purple-600 text-white text-[11px] font-black  tracking-widest rounded-xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 disabled:opacity-50 flex items-center gap-2"
                       >
                         {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                         {isSubmitting ? "Enviando..." : "Abrir Chamado"}
                       </button>
                    </div>
                 </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
