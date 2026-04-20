import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { PlanFeature, hasFeature, FEATURE_MESSAGES } from '@/lib/permissions';

interface PlanGateProps {
  planFeatures: any;
  feature: PlanFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente que bloqueia o acesso a uma funcionalidade baseado no plano do lojista
 */
export function PlanGate({ planFeatures, feature, children, fallback }: PlanGateProps) {
  const allowed = hasFeature(planFeatures, feature);

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-12 flex flex-col items-center justify-center text-center opacity-80">
      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 mb-6">
        <Lock size={32} />
      </div>
      <h3 className="text-xl font-black text-slate-800 uppercase italic-none tracking-tight mb-2">Recurso Bloqueado</h3>
      <p className="text-slate-500 text-sm font-bold max-w-xs mb-8">
        {FEATURE_MESSAGES[feature]}
      </p>
      
      <button className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-orange-500/20 hover:scale-105 transition-all">
        <Sparkles size={16} /> Fazer Upgrade Agora
      </button>
    </div>
  );
}
