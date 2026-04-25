"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Image as ImageIcon, Loader2, User } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface SupportChatProps {
  ticketId: string;
}

export function SupportChat({ ticketId }: SupportChatProps) {
  const { data: session } = useSession();
  const [ticket, setTicket] = useState<any>(null);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Polling a cada 10s
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticket?.messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`);
      const data = await res.json();
      setTicket(data);
    } catch (error) {
      console.error("Erro ao carregar mensagens");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, attachmentUrl?: string) => {
    e?.preventDefault();
    if (!content.trim() && !attachmentUrl) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, attachmentUrl })
      });

      if (res.ok) {
        setContent("");
        fetchMessages();
      } else {
        toast.error("Erro ao enviar mensagem");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setIsSending(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (data.url) {
        handleSendMessage(undefined, data.url);
      } else {
        toast.error("Erro ao processar arquivo");
      }
    } catch (error) {
      toast.error("Erro ao fazer upload da imagem");
    } finally {
      setIsUploading(false);
    }
  };

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 sidebar-scrollbar bg-slate-50/30"
      >
        {ticket?.messages && Array.isArray(ticket.messages) ? ticket.messages.map((msg: any) => {
          const isMe = msg.senderId === session?.user?.id;
          const isSenderAdmin = msg.sender.role === "SUPERADMIN";

          return (
            <div 
              key={msg.id} 
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
            >
              <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-shrink-0 mt-auto mb-1">
                  {msg.sender.image ? (
                    <img src={msg.sender.image} alt="" className="w-7 h-7 rounded-full border border-slate-100" />
                  ) : (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isSenderAdmin ? 'bg-purple-100 text-purple-600' : 'bg-slate-800 text-white'}`}>
                      <User size={12} />
                    </div>
                  )}
                </div>
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[9px] font-black text-slate-400  tracking-widest">
                      {msg.sender.name}
                    </span>
                    <span className="text-[8px] text-slate-300 font-bold">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className={`
                    p-3 rounded-xl text-xs font-medium shadow-sm leading-relaxed
                    ${isSenderAdmin 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-navy text-white'}
                    ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}
                  `}>
                    {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                    
                    {msg.attachmentUrl && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-black/5">
                        <img 
                          src={msg.attachmentUrl} 
                          alt="Anexo" 
                          className="max-w-full h-auto hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(msg.attachmentUrl, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }) : null}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 focus-within:border-purple-200 transition-all">
          <label className="p-2 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer disabled:opacity-50">
             {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
             <input 
               type="file" 
               accept="image/*" 
               className="hidden" 
               onChange={handleUploadImage}
               disabled={isUploading || isSending}
             />
          </label>

          <textarea 
            rows={1}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-sm font-bold text-slate-700 placeholder:text-slate-400 resize-none max-h-32"
          />

          <button 
            type="submit"
            disabled={isSending || isUploading || !content.trim()}
            className="p-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:shadow-none"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
