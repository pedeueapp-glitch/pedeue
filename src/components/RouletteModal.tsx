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
    
    // Rotação dinâmica (10 a 15 voltas) + ajuste para a seta (topo = 270 graus no SVG)
    const extraSpins = 10 + Math.floor(Math.random() * 5); 
    const targetDegree = 360 - (selectedIndex * degreePerOption) - (degreePerOption / 2);
    const newRotation = rotation + (extraSpins * 360) + targetDegree;
    
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const winPrize = config.options[selectedIndex];
      setResult(winPrize);
      setTimeout(() => {
        onWin(winPrize);
      }, 1500);
    }, 5000);
  };

  // Helper para desenhar fatias SVG
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians)
        };
    };

    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "L", x, y,
        "Z"
    ].join(" ");
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-300 border border-white/20">
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
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">Roleta da Sorte</h2>
                <div className="flex items-center justify-center gap-2 text-emerald-500 bg-emerald-50 px-4 py-1 rounded-full w-fit mx-auto border border-emerald-100">
                   <ShieldCheck size={12} />
                   <p className="text-[9px] font-black uppercase tracking-widest">Resultado Seguro e Único</p>
                </div>
            </div>

            {/* Visual da Roleta SVG */}
            <div className="relative aspect-square max-w-[320px] mx-auto">
                {/* Seta Indicadora */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                   <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-500 drop-shadow-lg"></div>
                </div>
                
                <div 
                    className="w-full h-full transition-transform duration-[5000ms] ease-[cubic-bezier(0.2,0,0,1)]"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-2xl">
                        {config.options.map((opt, i) => {
                            const count = config.options.length;
                            const step = 360 / count;
                            const startAngle = i * step;
                            const endAngle = (i + 1) * step;
                            
                            // Centro da fatia para o texto
                            const textAngle = startAngle + step / 2;
                            const textRadius = 35;
                            const textX = 50 + textRadius * Math.cos(((textAngle - 90) * Math.PI) / 180.0);
                            const textY = 50 + textRadius * Math.sin(((textAngle - 90) * Math.PI) / 180.0);

                            return (
                                <g key={i}>
                                    <path 
                                        d={describeArc(50, 50, 48, startAngle, endAngle)} 
                                        fill={opt.color}
                                        stroke="#fff"
                                        strokeWidth="0.5"
                                    />
                                    <text 
                                        x={textX} 
                                        y={textY} 
                                        fill="white" 
                                        fontSize="3.5" 
                                        fontWeight="900" 
                                        textAnchor="middle" 
                                        dominantBaseline="middle"
                                        transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                                        style={{ textTransform: 'uppercase', pointerEvents: 'none' }}
                                    >
                                        {opt.label}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Botão Central */}
                <div className="absolute inset-0 flex items-center justify-center">
                     <button 
                        onClick={spin}
                        disabled={isSpinning || !!result}
                        className={`
                            w-24 h-24 bg-white rounded-full shadow-2xl z-40 border-[8px] border-slate-100 
                            flex flex-col items-center justify-center transition-all active:scale-90
                            ${isSpinning ? 'cursor-not-allowed' : 'hover:scale-105'}
                        `}
                     >
                        {isSpinning ? (
                            <Loader2 className="animate-spin text-purple-600" size={32} />
                        ) : result ? (
                            <Trophy className="text-emerald-500" size={32} />
                        ) : (
                            <>
                                <RotateCw className="text-purple-600 mb-1" size={24} />
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Girar</span>
                            </>
                        )}
                     </button>
                </div>
            </div>

            <div className="pt-2">
                {result ? (
                    <div className="animate-in slide-in-from-bottom duration-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Prêmio Sorteado!</p>
                        <div className={`text-xl font-black py-4 px-10 rounded-2xl inline-flex items-center gap-3 ${result.type === 'LOSE' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                            {result.type !== 'LOSE' && <Trophy size={20} />}
                            {result.label}
                        </div>
                    </div>
                ) : (
                   <p className="text-[11px] font-bold text-slate-400 max-w-[200px] mx-auto uppercase tracking-tighter leading-tight">
                      Toque no botão central <br/> para sortear seu prêmio
                   </p>
                )}
            </div>
            
            <div className="pt-4 border-t border-slate-100">
               <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                  Caso atualize a página, o resultado será mantido.
               </p>
            </div>
        </div>
      </div>
    </div>
  );
}
