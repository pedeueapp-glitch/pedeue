"use client";

import { useState, useEffect, useRef } from "react";
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Loader2, 
  AlertCircle,
  Zap,
  Star,
  Trophy,
  QrCode,
  Copy,
  ChevronRight,
  History,
  Info,
  RefreshCcw,
  Gift,
  ArrowRight
} from "lucide-react";
import { Header } from "@/components/Header";
import toast from "react-hot-toast";
import { formatDistanceToNow, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [changingTo, setChangingTo] = useState<string | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [selectedMonths, setSelectedMonths] = useState<{ [key: string]: number }>({});
  const [checkingStatus, setCheckingStatus] = useState(false);
  const pollingInterval = useRef<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resStore, resPlans, resPayments] = await Promise.all([
        fetch("/api/store"),
        fetch("/api/plans"),
        fetch("/api/payments/history")
      ]);
      const storeData = await resStore.json();
      const plansData = await resPlans.json();
      const paymentsData = await resPayments.json();
      
      setStore(storeData);
      
      // Filtra planos compatíveis com o tipo de loja
      const filteredPlans = Array.isArray(plansData) ? plansData.filter((p: any) => {
        if (!p.allowedStoreTypes) return true;
        const allowed = p.allowedStoreTypes.split(',');
        return allowed.includes(storeData.storeType || 'RESTAURANT');
      }) : [];

      setPlans(filteredPlans);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);

      // Initialize selected months for each plan
      const initialMonths: { [key: string]: number } = {};
      filteredPlans.forEach((p: any) => initialMonths[p.id] = 1);
      setSelectedMonths(initialMonths);

    } catch (error) {
      toast.error("Erro ao carregar dados da assinatura");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  const checkPaymentStatus = async (txid: string, isManual = false) => {
    if (isManual) setCheckingStatus(true);
    try {
      const res = await fetch(`/api/payments/status/${txid}`);
      const data = await res.json();
      if (data.confirmed) {
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        setPixData(null);
        toast.success("Pagamento confirmado! Sua assinatura foi atualizada.", { duration: 6000 });
        fetchData();
        return true;
      } else if (isManual) {
        toast.error("Pagamento ainda não detectado. Aguarde alguns segundos.");
      }
    } catch (e) {
      console.error("Erro ao verificar status", e);
    } finally {
      if (isManual) setCheckingStatus(false);
    }
    return false;
  };

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (pixData?.txid) {
      pollingInterval.current = setInterval(() => {
        checkPaymentStatus(pixData.txid);
      }, 5000); // Verifica a cada 5 segundos
    } else {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    }

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [pixData]);

  const handlePlanChange = async (planId: string) => {
    const months = selectedMonths[planId] || 1;
    
    // Validação de CPF
    if (!store?.cpf || store.cpf.replace(/\D/g, '').length !== 11) {
      toast.error("Por favor, preencha seu CPF corretamente nas configurações antes de assinar.");
      return;
    }

    setChangingTo(planId);
    try {
      const res = await fetch("/api/checkout/efi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          storeId: store.id,
          months,
          customer: {
            name: store.name,
            document: store.cpf
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setPixData(data);
      } else {
        toast.error(data.error || "Erro ao gerar pagamento. Verifique seu CPF.");
      }
    } catch (error) {
      toast.error("Erro ao processar solicitação");
    } finally {
      setChangingTo(null);
    }
  };

  const getDiscountedPrice = (basePrice: number, months: number) => {
    const total = basePrice * months;
    if (months === 3) return total * 0.9;
    if (months === 6) return total * 0.8;
    if (months === 12) return total * 0.7;
    if (months === 24) return total * 0.6;
    return total;
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center h-screen bg-slate-50">
      <Loader2 className="animate-spin text-purple-500" size={40} />
    </div>
  );

  const subscription = store?.subscription;
  const currentPlan = subscription?.plan;
  const expiresAt = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;
  const daysLeft = expiresAt ? differenceInDays(expiresAt, new Date()) : 0;
  const isTrial = subscription?.status === "TRIALING";

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <Header title="Minha Assinatura" />

      <div className="p-6 lg:p-10 max-w-6xl mx-auto w-full space-y-12">
        
        {/* CARD DO PLANO ATUAL */}
        <div className="bg-[#0f172a] rounded-2xl p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
           
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                 <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                    <Zap size={14} className="text-purple-400" />
                    <span className="text-[10px] font-black  tracking-widest">Plano Atual</span>
                 </div>
                 
                 <div>
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tight">{currentPlan?.name || "Sem Plano"}</h2>
                    <p className="text-slate-400 mt-2 font-medium">Status: 
                       <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-black  tracking-widest ${subscription?.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {subscription?.status === 'ACTIVE' ? 'Ativo' : isTrial ? 'Teste' : 'Pendente'}
                       </span>
                    </p>
                 </div>

                 <div className="flex items-center gap-8">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-500  tracking-widest">Vencimento</p>
                       <p className="text-lg font-bold flex items-center gap-2">
                          <Calendar size={18} className="text-purple-400" />
                          {expiresAt ? format(expiresAt, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "N/A"}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-6 text-center">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400  tracking-widest">Dias Restantes</p>
                    <div className="text-6xl font-black text-purple-400">{Math.max(0, daysLeft)}</div>
                    <p className="text-sm font-bold text-slate-300">dias de acesso total</p>
                 </div>
                 
                 <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }}
                    />
                 </div>
                 
                 <p className="text-[10px] text-slate-500 font-bold  tracking-tight italic">
                    {daysLeft <= 7 ? "⚠️ Sua assinatura expira em breve!" : "Tudo pronto por aqui!"}
                 </p>
              </div>
           </div>
        </div>

        {/* LISTAGEM DE PLANOS */}
        <div className="space-y-8">
           <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-800  tracking-tight">Planos e Upgrades</h3>
              <p className="text-slate-500 font-medium">Escolha a melhor opção para o seu negócio.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => {
                 const isCurrent = plan.id === currentPlan?.id;
                 const selectedM = selectedMonths[plan.id] || 1;
                 const originalTotal = plan.price * selectedM;
                 const totalPrice = getDiscountedPrice(plan.price, selectedM);
                 const economy = originalTotal - totalPrice;
                 
                 let featuresObj = {};
                 try {
                   featuresObj = plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : {};
                 } catch (e) {}
                 
                 const featureLabels: { [key: string]: string } = {
                    PDV_SYSTEM: "Sistema PDV Profissional",
                    TABLE_MANAGEMENT: "Gestão de Mesas e Comandas",
                    DIGITAL_MENU: "Cardápio Digital Online",
                    WAITER_APP: "Aplicativo para Garçons",
                    DELIVERY_SYSTEM: "Gestão de Entregas e Motoboys",
                    COUPON_SYSTEM: "Sistema de Cupons de Desconto",
                    AUTO_PRINT: "Impressão Automática de Pedidos"
                 };

                 const activeFeatures = Object.entries(featuresObj)
                    .filter(([_, active]) => active)
                    .map(([key, _]) => featureLabels[key] || key);

                 return (
                    <div 
                      key={plan.id} 
                      className={`bg-white rounded-2xl border-2 transition-all p-8 space-y-6 relative overflow-hidden flex flex-col ${isCurrent ? 'border-purple-500 shadow-xl' : 'border-slate-100 hover:border-slate-300'}`}
                    >
                       {isCurrent && (
                          <div className="absolute top-6 right-6 bg-purple-500 text-white px-3 py-1 rounded-full text-[8px] font-black  tracking-widest">
                             Seu Plano
                          </div>
                       )}

                       <div className="space-y-4">
                          <h4 className="text-xl font-black text-slate-800  tracking-tight">{plan.name}</h4>
                          
                          {/* Novo Seletor de Duração */}
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">Período de Assinatura</label>
                              <div className="relative group">
                                <select 
                                  value={selectedM}
                                  onChange={(e) => setSelectedMonths({ ...selectedMonths, [plan.id]: Number(e.target.value) })}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black text-slate-700 outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer group-hover:bg-slate-100"
                                >
                                  <option value={1}>Mensal (R$ {plan.price.toFixed(2)}/mês)</option>
                                  <option value={3}>Trimestral (3 meses) - 10% OFF</option>
                                  <option value={6}>Semestral (6 meses) - 20% OFF</option>
                                  <option value={12}>Anual (12 meses) - 30% OFF</option>
                                  <option value={24}>Bienal (24 meses) - 40% OFF</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                  <ChevronRight size={16} className="rotate-90" />
                                </div>
                              </div>
                            </div>

                            {/* Resumo Financeiro Detalhado */}
                            <div className="bg-slate-50 rounded-3xl p-5 space-y-3 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400  tracking-wider">
                                <span>Subtotal ({selectedM}x)</span>
                                <span className={selectedM > 1 ? "line-through" : ""}>R$ {originalTotal.toFixed(2)}</span>
                              </div>
                              
                              {selectedM > 1 && (
                                <div className="flex justify-between items-center text-[10px] font-black text-green-500  tracking-wider bg-green-500/5 px-2 py-1 rounded-lg">
                                  <div className="flex items-center gap-1">
                                    <Gift size={10} />
                                    <span>Economia Aplicada</span>
                                  </div>
                                  <span>- R$ {economy.toFixed(2)}</span>
                                </div>
                              )}

                              <div className="pt-2 border-t border-slate-200">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[11px] font-black text-slate-800  tracking-tight">Total a Pagar</span>
                                  <div className="text-right">
                                    <div className="text-2xl font-black text-purple-600 tracking-tight">R$ {totalPrice.toFixed(2)}</div>
                                    <p className="text-[9px] text-slate-400 font-bold  tracking-tighter">R$ {(totalPrice / selectedM).toFixed(2)} / mês</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                       </div>

                       <div className="flex-1 space-y-4 pt-4">
                          <p className="text-[10px] font-black text-slate-400  tracking-widest">Recursos Inclusos</p>
                          <ul className="space-y-2">
                             <li className="flex items-start gap-2 text-[11px] text-slate-600 font-medium">
                                <CheckCircle2 size={14} className="text-purple-500 mt-0.5 shrink-0" />
                                <span>Até {plan.maxProducts} Produtos</span>
                             </li>
                             {activeFeatures.slice(0, 5).map((label: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 font-medium">
                                   <CheckCircle2 size={14} className="text-purple-500 mt-0.5 shrink-0" />
                                   <span>{label}</span>
                                </li>
                             ))}
                          </ul>
                       </div>

                       <button
                          onClick={() => handlePlanChange(plan.id)}
                          disabled={changingTo === plan.id}
                          className={`w-full py-5 rounded-2xl font-black  tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 ${isCurrent ? 'bg-green-50 text-green-600 border border-green-100 hover:bg-green-100' : 'bg-[#0f172a] text-white hover:bg-navy/90 shadow-xl shadow-black/10 active:scale-95'}`}
                       >
                          {changingTo === plan.id ? <Loader2 size={16} className="animate-spin" /> : isCurrent ? "Renovar / Estender Plano" : "Ativar Assinatura"}
                          {changingTo !== plan.id && <ArrowRight size={14} />}
                       </button>
                    </div>
                 );
              })}
           </div>
        </div>

        {/* HISTÓRICO DE PAGAMENTOS */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
           <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <History size={24} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-800  tracking-tight">Histórico de Pagamentos</h3>
                    <p className="text-xs text-slate-400 font-medium">Acompanhe suas transações e faturas anteriores.</p>
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400  tracking-widest">Data</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400  tracking-widest">Valor</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400  tracking-widest">Método</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400  tracking-widest">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {payments.length === 0 ? (
                       <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-xs font-medium italic">
                             Nenhum pagamento registrado até o momento.
                          </td>
                       </tr>
                    ) : payments.map((payment) => (
                       <tr key={payment.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-5 text-xs font-bold text-slate-600">
                             {format(new Date(payment.createdAt), "dd/MM/yyyy HH:mm")}
                          </td>
                          <td className="px-8 py-5 text-xs font-black text-slate-900">
                             R$ {payment.amount.toFixed(2)}
                          </td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-500  tracking-widest">
                             {payment.paymentMethod || "Pix"}
                          </td>
                          <td className="px-8 py-5">
                             <span className={`px-3 py-1 rounded-full text-[9px] font-black  tracking-widest ${
                                payment.status === 'confirmed' || payment.status === 'paid' || payment.status === 'ACTIVE'
                                   ? 'bg-green-500/10 text-green-500' 
                                   : payment.status === 'pending' 
                                   ? 'bg-yellow-500/10 text-yellow-500' 
                                   : 'bg-red-500/10 text-red-500'
                             }`}>
                                {payment.status === 'confirmed' || payment.status === 'paid' || payment.status === 'ACTIVE' ? 'Sucesso' : payment.status === 'pending' ? 'Pendente' : 'Falhou'}
                             </span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* INFORMAÇÕES ADICIONAIS */}
        <div className="bg-white rounded-xl p-8 border border-slate-100 flex flex-col md:flex-row items-center gap-8 justify-between">
           <div className="flex items-center gap-6 text-left">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                 <Info size={32} />
              </div>
              <div className="space-y-1">
                 <h4 className="font-black text-slate-800  text-xs tracking-widest">Dúvidas sobre Pagamentos?</h4>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                    O processamento via Pix é instantâneo. Assim que confirmado, seu acesso será atualizado automaticamente. 
                    Em caso de problemas, entre em contato com nosso suporte.
                 </p>
              </div>
           </div>
           <button 
             onClick={() => window.open("https://wa.me/5500000000000", "_blank")}
             className="text-[#0f172a] font-black text-xs  tracking-widest hover:underline"
           >
              Suporte Financeiro
           </button>
        </div>

      </div>

      {/* MODAL DE PAGAMENTO PIX */}
      {pixData && (
        <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-10 text-center space-y-6">
                 <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <QrCode size={40} />
                 </div>
                 
                 <div>
                    <h3 className="text-2xl font-black text-slate-900  tracking-tight">Pagamento via Pix</h3>
                    <p className="text-slate-500 font-medium mt-1">Escaneie o QR Code abaixo ou copie a chave Pix</p>
                 </div>

                 <div className="relative mx-auto w-64 h-64 bg-slate-50 rounded-2xl border-2 border-slate-100 p-6 flex items-center justify-center">
                    <img 
                      src={pixData.pixImage.startsWith('data:') ? pixData.pixImage : `data:image/png;base64,${pixData.pixImage}`} 
                      alt="QR Code Pix" 
                      className="w-full h-full object-contain" 
                    />
                 </div>

                 <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-center gap-3">
                       <Loader2 className="animate-spin text-yellow-600" size={16} />
                       <p className="text-[10px] text-yellow-700 font-bold  tracking-tight">Aguardando confirmação do pagamento...</p>
                    </div>

                    <button
                       onClick={() => {
                          navigator.clipboard.writeText(pixData.pixCopyPaste);
                          toast.success("Copiado!");
                       }}
                       className="w-full py-5 bg-[#0f172a] text-white rounded-2xl font-black  tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-navy/90 transition-all active:scale-95 shadow-lg shadow-black/20"
                    >
                       <Copy size={16} /> Copiar Código Pix Copia e Cola
                    </button>

                    <button
                       onClick={() => checkPaymentStatus(pixData.txid, true)}
                       disabled={checkingStatus}
                       className="w-full py-4 bg-green-500 text-white rounded-2xl font-black  tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-green-600 transition-all active:scale-95 shadow-lg shadow-green-500/20 disabled:opacity-70"
                    >
                       {checkingStatus ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                       Já fiz o pagamento
                    </button>
                    
                    <button
                       onClick={() => {
                          setPixData(null);
                          fetchData();
                       }}
                       className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black  tracking-widest text-[10px] hover:text-slate-600 transition-all"
                    >
                       Fechar e verificar depois
                    </button>
                 </div>

                 <p className="text-[10px] text-slate-400 font-bold  tracking-widest">
                    O acesso será liberado assim que o Pix for confirmado.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
