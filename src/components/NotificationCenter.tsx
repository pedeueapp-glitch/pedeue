"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export function NotificationCenter() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Carregar IDs lidos do localStorage
    const saved = localStorage.getItem("read_announcements");
    if (saved) setReadIds(JSON.parse(saved));

    // Buscar anúncios
    fetch("/api/superadmin/announcements")
      .then(res => res.json())
      .then(data => {
        if (data.announcements) setAnnouncements(data.announcements);
      })
      .catch(() => {});

    // Fechar dropdown ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = announcements.filter(a => !readIds.includes(a.id)).length;

  const markAllAsRead = () => {
    const allIds = announcements.map(a => a.id);
    setReadIds(allIds);
    localStorage.setItem("read_announcements", JSON.stringify(allIds));
  };

  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const newReadIds = [...readIds, id];
    setReadIds(newReadIds);
    localStorage.setItem("read_announcements", JSON.stringify(newReadIds));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all relative group"
      >
        <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[400px] bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-black text-slate-900  tracking-tight">Notificações</h3>
              <p className="text-[10px] font-bold text-slate-400 ">Avisos importantes do sistema</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[9px] font-black text-purple-600  hover:underline"
              >
                Marcar tudo como lido
              </button>
            )}
          </div>

          <div className="max-h-[450px] overflow-y-auto divide-y divide-slate-50">
            {announcements.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-xs font-bold text-slate-400  tracking-widest">Tudo limpo por aqui!</p>
              </div>
            ) : (
              announcements.map((a) => {
                const isRead = readIds.includes(a.id);
                return (
                  <div 
                    key={a.id} 
                    className={`p-5 hover:bg-slate-50 transition-all relative cursor-pointer ${!isRead ? 'bg-purple-50/30' : ''}`}
                    onClick={() => markAsRead(a.id)}
                  >
                    {!isRead && <div className="absolute top-6 right-6 w-2 h-2 bg-purple-500 rounded-full" />}
                    <div className="flex gap-4">
                      <div className={`mt-1 p-2 rounded-lg ${
                        a.type === 'CRITICAL' ? 'bg-red-50 text-red-500' : 
                        a.type === 'WARNING' ? 'bg-yellow-50 text-yellow-600' : 
                        'bg-blue-50 text-blue-500'
                      }`}>
                        {a.type === 'CRITICAL' ? <AlertTriangle size={16} /> : <Info size={16} />}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-xs font-black  tracking-tight mb-1 ${!isRead ? 'text-slate-900' : 'text-slate-500'}`}>
                          {a.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                          {a.content}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400  mt-2 block">
                          {format(new Date(a.createdAt), 'dd MMM, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
             <p className="text-[9px] font-bold text-slate-400  tracking-widest">Fim das notificações</p>
          </div>
        </div>
      )}
    </div>
  );
}
