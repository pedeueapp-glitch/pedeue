"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger"
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-purple-50 text-purple-500'}`}>
              <AlertTriangle size={28} />
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-navy hover:bg-slate-50 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <h3 className="text-2xl font-black text-navy mb-2 italic-none">{title}</h3>
          <p className="text-slate-500 font-medium leading-relaxed italic-none">
            {message}
          </p>
        </div>

        <div className="p-8 bg-slate-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-sm font-black  tracking-widest text-slate-400 hover:text-navy transition-all"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-4 rounded-2xl text-sm font-black  tracking-widest text-white shadow-lg transition-all active:scale-95 ${
              variant === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
