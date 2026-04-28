"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, X, Loader2, Trophy, ShieldCheck, RotateCw } from "lucide-react";

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
    if (isSpinning || result) return;

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
    
    // Rotação maior para durar mais e ser mais dinâmica
    const extraSpins = 10 + Math.floor(Math.random() * 5); 
    const targetDegree = 360 - (selectedIndex * degreePerOption) - (degreePerOption / 2);
    const newRotation = rotation + (extraSpins * 360) + targetDegree;
    
    setRotation(newRotation);

    // 5 segundos de animação total com desaceleração suave
    setTimeout(() => {
      setIsSpinning(false);
      const winPrize = config.options[selectedIndex];
      setResult(winPrize);
      setTimeout(() => {
        onWin(winPrize);
      }, 1500);
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.3)] relative animate-in zoom-in-95 duration-300 border border-white/20">
        <button 
            onClick={onClose}
            disabled={isSpinning}
            className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors z-20"
        >
            <X size={24} />
        </button>

        <div className="p-8 md:p-10 text-center space-y-8">
            <div className="space-y-2">
                <div className="flex justify-center mb-2">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-inner">
                        <Sparkles size={28} />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Roleta da Sorte</h2>
                <div className="flex items-center justify-center gap-2 text-emerald-500 bg-emerald-50 px-4 py-1.5 rounded-full w-fit mx-auto border border-emerald-100">
                   <ShieldCheck size={14} />
                   <p className="text-[9px] font-black uppercase tracking-widest">Giro Seguro e Único</p>
                </div>
            </div>

            {/* Visual da Roleta */}
            <div className="relative aspect-square max-w-[320px] mx-auto group">
                {/* Seta Indicadora Premium */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                   <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-500 drop-shadow-[0_8px_16px_rgba(239,68,68,0.4)]"></div>
                   <div className="w-3 h-3 bg-red-600 rounded-full mt-[-12px] z-30 border-2 border-white shadow-lg"></div>
                </div>
                
                <div 
                    ref={wheelRef}
                    className="w-full h-full rounded-full border-[12px] border-slate-50 shadow-[0_20px_50px_rgba(0,0,0,0.15),inset_0_0_40px_rgba(0,0,0,0.05)] relative overflow-hidden transition-transform duration-[5000ms] ease-[cubic-bezier(0.2,0,0,1)]"
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
                                    boxShadow: 'inset 0 0 60px rgba(0,0,0,0.1)'
                                }}
                            >
                                <div 
                                    className="absolute left-[-100%] w-[200%] h-full flex items-start justify-center pt-10"
                                    style={{ 
                                        transform: `skewY(-${90 - degree}deg) rotate(${degree / 2}deg)`,
                                    }}
                                >
                                    <span className="text-[10px] font-black text-white uppercase tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] max-w-[60px] leading-none text-center">
                                        {opt.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Botão Central "GIRAR" */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <button 
                        onClick={spin}
                        disabled={isSpinning || !!result}
                        className={`
                            w-24 h-24 bg-white rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.2)] z-40 border-[8px] border-slate-50 
                            flex flex-col items-center justify-center transition-all active:scale-90 pointer-events-auto
                            ${isSpinning ? 'opacity-100 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                        `}
                     >
                        {isSpinning ? (
                            <Loader2 className="animate-spin text-purple-600" size={32} />
                        ) : result ? (
                            <Trophy className="text-emerald-500" size={32} />
                        ) : (
                            <>
                                <RotateCw className="text-purple-600 mb-1" size={24} />
                                <span className="text-[10px] font-black text-slate-800 tracking-widest uppercase">Girar</span>
                            </>
                        )}
                     </button>
                </div>
            </div>

            <div className="pt-2">
                {result ? (
                    <div className="animate-in slide-in-from-bottom duration-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 italic">Seu prêmio foi selecionado!</p>
                        <div className={`text-xl font-black py-4 px-10 rounded-2xl inline-flex items-center gap-3 shadow-sm ${result.type === 'LOSE' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                            {result.type !== 'LOSE' && <Trophy size={20} />}
                            {result.label}
                        </div>
                    </div>
                ) : (
                   <p className="text-[11px] font-bold text-slate-400 leading-relaxed max-w-[200px] mx-auto uppercase tracking-tighter">
                      Toque no botão central <br/> para sortear seu prêmio
                   </p>
                )}
            </div>
            
            <div className="pt-4 border-t border-slate-50">
               <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                  A sorte está lançada! Aproveite.
               </p>
            </div>
        </div>
      </div>
    </div>
  );
}
