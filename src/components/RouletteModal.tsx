"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, X, Loader2, Trophy, ShieldCheck } from "lucide-react";

interface RouletteOption {
  label: string;
  value: string;
  type: "PERCENT" | "FIXED" | "FREE_DELIVERY" | "LOSE";
  weight: number;
  color: string;
}

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: {
    active: boolean;
    minOrderValue: number;
    options: RouletteOption[];
  };
  onWin: (prize: RouletteOption) => void;
}

export default function RouletteModal({ isOpen, onClose, config, onWin }: RouletteModalProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<RouletteOption | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !config.active || config.options.length === 0) return null;

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    const totalWeight = config.options.reduce((acc, opt) => acc + opt.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedIndex = 0;
    for (let i = 0; i < config.options.length; i++) {
        random -= config.options[i].weight;
        if (random <= 0) {
            selectedIndex = i;
            break;
        }
    }

    const optionCount = config.options.length;
    const degreePerOption = 360 / optionCount;
    
    const extraSpins = 8 + Math.floor(Math.random() * 5); 
    const targetDegree = 360 - (selectedIndex * degreePerOption) - (degreePerOption / 2);
    const newRotation = rotation + (extraSpins * 360) + targetDegree;
    
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(config.options[selectedIndex]);
      setTimeout(() => {
        onWin(config.options[selectedIndex]);
      }, 1500);
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-300">
        <button 
            onClick={onClose}
            disabled={isSpinning}
            className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors z-20"
        >
            <X size={24} />
        </button>

        <div className="p-10 text-center space-y-8">
            <div className="space-y-2">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-inner">
                        <Sparkles size={32} />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Roleta da Sorte!</h2>
                <div className="flex items-center justify-center gap-2 text-purple-500 bg-purple-50 px-4 py-1.5 rounded-full w-fit mx-auto border border-purple-100">
                   <ShieldCheck size={14} />
                   <p className="text-[10px] font-black uppercase tracking-widest">Resultado Definitivo e Único</p>
                </div>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[250px] mx-auto mt-4">
                   Gire a roda e garanta o seu benefício exclusivo agora!
                </p>
            </div>

            {/* Visual da Roleta */}
            <div className="relative aspect-square max-w-[300px] mx-auto py-6">
                {/* Seta Indicadora */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                   <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[30px] border-t-red-500 drop-shadow-[0_4px_12px_rgba(239,68,68,0.5)]"></div>
                   <div className="w-2 h-2 bg-red-600 rounded-full mt-[-10px] z-30 shadow-lg"></div>
                </div>
                
                <div 
                    ref={wheelRef}
                    className="w-full h-full rounded-full border-[10px] border-slate-50 shadow-[0_0_40px_rgba(0,0,0,0.1),inset_0_0_20px_rgba(0,0,0,0.05)] relative overflow-hidden transition-transform duration-[5000ms] cubic-bezier(0.15, 0, 0.15, 1)"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    {config.options.map((opt, i) => {
                        const count = config.options.length;
                        const degree = 360 / count;
                        return (
                            <div 
                                key={i}
                                className="absolute top-0 left-1/2 w-1/2 h-full origin-left"
                                style={{ 
                                    backgroundColor: opt.color,
                                    transform: `rotate(${i * degree}deg) skewY(${90 - degree}deg)`,
                                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1)'
                                }}
                            >
                                {/* O texto agora está em um container separado que compensa o skew e rotaciona para o centro da fatia */}
                                <div 
                                    className="absolute left-[-100%] w-[200%] h-full flex items-start justify-center pt-8"
                                    style={{ 
                                        transform: `skewY(-${90 - degree}deg) rotate(${degree / 2}deg)`,
                                    }}
                                >
                                    <span className="text-[11px] font-black text-white uppercase tracking-tighter drop-shadow-md max-w-[70px] leading-none">
                                        {opt.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Centro da Roda */}
                    <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-20 h-20 bg-white rounded-full shadow-2xl z-10 border-[6px] border-slate-100 flex items-center justify-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                <Trophy size={24} />
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                {result ? (
                    <div className="animate-in slide-in-from-bottom duration-500">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Resultado Sorteado!</p>
                        <div className={`text-2xl font-black py-4 px-8 rounded-2xl inline-block ${result.type === 'LOSE' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                            {result.label}
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={spin}
                        disabled={isSpinning}
                        className="w-full bg-slate-900 text-white py-6 rounded-2xl text-xs font-black tracking-[0.2em] hover:bg-brand transition-all shadow-2xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                        {isSpinning ? (
                           <div className="flex items-center justify-center gap-3">
                              <Loader2 className="animate-spin" size={18} />
                              <span>SORTEANDO...</span>
                           </div>
                        ) : "GIRAR A ROLETA!"}
                    </button>
                )}
            </div>
            
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">
               * Caso feche a página, o resultado será mantido.
            </p>
        </div>
      </div>
    </div>
  );
}
