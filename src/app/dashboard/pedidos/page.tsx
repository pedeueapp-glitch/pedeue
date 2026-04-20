"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  Loader2,
  Search,
  MessageCircle,
  MoreVertical
} from "lucide-react";
import toast from "react-hot-toast";

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  total: number;
  status: "PENDING" | "ACCEPTED" | "PREPARING" | "DELIVERING" | "DONE" | "CANCELED";
  paymentMethod: string;
  createdAt: string;
}

const statusMap = {
  PENDING: { label: "Pendente", color: "bg-orange-100 text-orange-700", icon: Clock },
  ACCEPTED: { label: "Aceito", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  PREPARING: { label: "Preparando", color: "bg-purple-100 text-purple-700", icon: Loader2 },
  DELIVERING: { label: "Rota de Entrega", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  DONE: { label: "Entregue", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  CANCELED: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders"); // Você precisará deste endpoint ou ajustá-lo
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function updateStatus(orderId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status atualizado!");
      loadOrders();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">PDV - Gestão de Pedidos</h2>
          <p className="text-gray-500 text-sm">Gerencie os pedidos em tempo real</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar pedido..." 
            className="input-field !pl-10 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhum pedido recebido ainda.</p>
          </div>
        ) : (
          orders.map((order) => {
            const status = statusMap[order.status];
            const StatusIcon = status.icon;

            return (
              <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100">
                    <span className="text-lg font-black text-gray-400">#{order.orderNumber}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{order.customerName}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.createdAt).toLocaleTimeString()}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-md font-bold text-gray-600">{order.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold ${status.color}`}>
                    <StatusIcon className={`w-4 h-4 ${order.status === "PREPARING" ? "animate-spin" : ""}`} />
                    {status.label}
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-400">Total</div>
                    <div className="text-lg font-black text-orange-600">R$ {order.total.toFixed(2)}</div>
                  </div>

                  <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                    <a 
                      href={`https://wa.me/${order.customerPhone}`} 
                      target="_blank"
                      className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-100 transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                    <select 
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      value={order.status}
                      className="bg-gray-50 border-none rounded-xl text-xs font-bold py-2.5 px-4 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="PENDING">Pendente</option>
                      <option value="ACCEPTED">Aceitar</option>
                      <option value="PREPARING">Preparar</option>
                      <option value="DELIVERING">Entregar</option>
                      <option value="DONE">Finalizar</option>
                      <option value="CANCELED">Cancelar</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
