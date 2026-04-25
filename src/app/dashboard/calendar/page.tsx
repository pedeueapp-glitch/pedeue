"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Header } from "@/components/Header";
import { Loader2, ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import toast from "react-hot-toast";

export default function CalendarPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch { toast.error("Erro ao carregar"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getOrdersForDate = (d: Date) => {
    return orders.filter(o => {
      if (!o.deliveryDeadline) return false;
      const deadline = new Date(o.deliveryDeadline);
      return deadline.getDate() === d.getDate() &&
             deadline.getMonth() === d.getMonth() &&
             deadline.getFullYear() === d.getFullYear();
    });
  };

  const tileContent = ({ date, view }: any) => {
    if (view === 'month') {
      const dayOrders = getOrdersForDate(date);
      if (dayOrders.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
          </div>
        );
      }
    }
    return null;
  };

  const selectedDayOrders = getOrdersForDate(date);

  return (
    <>
      <Header title="Calendário de Entregas" />

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* CALENDÁRIO */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
              <Calendar 
                onChange={(d: any) => setDate(d)} 
                value={date}
                tileContent={tileContent}
                className="w-full border-none font-sans"
              />
            </div>
          </div>

          {/* LISTA DO DIA */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-lg font-bold text-navy">
                 {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
               </h3>
               <span className="text-[10px] font-black  text-purple-500 bg-purple-50 px-3 py-1 rounded-full">
                 {selectedDayOrders.length} {selectedDayOrders.length === 1 ? 'Serviço' : 'Serviços'}
               </span>
            </div>

            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-purple-500" /></div>
            ) : selectedDayOrders.length === 0 ? (
              <div className="p-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                 <p className="text-xs font-bold text-slate-400">Nenhuma entrega prevista para este dia.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDayOrders.map((order) => (
                  <div key={order.id} className="bg-white border border-slate-100 p-5 rounded-lg shadow-sm hover:border-purple-200 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                       <span className="text-[10px] font-black text-navy ">#{order.orderNumber || order.id.slice(-4).toUpperCase()}</span>
                       <span className="text-[10px] font-black  px-2 py-0.5 bg-purple-100 text-purple-600 rounded">{order.status}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-2">{order.customerName}</h4>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                       <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(order.deliveryDeadline).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                       </div>
                       <div className="flex items-center gap-1">
                          <User size={12} />
                          {order.items?.length || 0} itens
                       </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                       <span className="text-xs font-black text-navy">R$ {order.total.toFixed(2)}</span>
                       <button 
                        onClick={() => window.location.href = `/dashboard/quotes?id=${order.id}`}
                        className="text-[9px] font-black  text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         Ver Detalhes
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <style jsx global>{`
        .react-calendar {
          border: none !important;
          width: 100% !important;
        }
        .react-calendar__navigation button {
          font-weight: bold;
          color: #0f172a;
          font-size: 1.2rem;
        }
        .react-calendar__month-view__weekdays__weekday {
          text-transform: ;
          font-size: 0.7rem;
          font-weight: 900;
          color: #94a3b8;
          padding-bottom: 1rem;
        }
        .react-calendar__tile {
          padding: 1.5rem 0.5rem !important;
          font-weight: bold;
          border-radius: 0.5rem;
        }
        .react-calendar__tile--now {
          background: #f8fafc !important;
          color: #8b5cf6 !important;
        }
        .react-calendar__tile--active {
          background: #8b5cf6 !important;
          color: white !important;
          box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.3);
        }
        .react-calendar__tile:hover {
          background: #f1f5f9 !important;
        }
        .react-calendar__tile--active:hover {
          background: #8b5cf6 !important;
        }
      `}</style>
    </>
  );
}
