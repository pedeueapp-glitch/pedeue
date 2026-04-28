"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, X, Loader2, Trophy } from "lucide-react";

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

    // Lógica de sorteio baseada em peso (Weight)
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
    
    // Calcular rotação final
    // Queremos que a opção sorteada pare no topo (onde está a seta)
    // A seta está em 0 graus. A primeira opção (index 0) começa em 0 e vai até degreePerOption.
    // Para a opção index parar no topo, a roda deve girar:
    // (360 - (index * degreePerOption)) + (várias voltas)
    
    const extraSpins = 5 + Math.floor(Math.random() * 5); // 5 a 10 voltas
    const targetDegree = 360 - (selectedIndex * degreePerOption) - (degreePerOption / 2);
    const newRotation = rotation + (extraSpins * 360) + targetDegree;
    
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(config.options[selectedIndex]);
      setTimeout(() => {
        onWin(config.options[selectedIndex]);
      }, 2000);
    }, 5000); // 5 segundos de giro
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button 
            onClick={onClose}
            disabled={isSpinning}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 z-20"
        >
            <X size={20} />
        </button>

        <div className="p-8 text-center space-y-6">
            <div className="space-y-1">
                <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <Sparkles size={24} />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Roleta da Sorte!</h2>
                <p className="text-slate-400 text-sm font-medium">Você atingiu o valor mínimo e ganhou um giro grátis!</p>
            </div>

            {/* Visual da Roleta */}
            <div className="relative aspect-square max-w-[280px] mx-auto py-4">
                {/* Seta Indicadora */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-red-500 drop-shadow-lg"></div>
                
                <div 
                    ref={wheelRef}
                    className="w-full h-full rounded-full border-8 border-slate-100 shadow-inner relative overflow-hidden transition-transform duration-[5000ms] cubic-bezier(0.15, 0, 0.15, 1)"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    {config.options.map((opt, i) => {
                        const count = config.options.length;
                        const degree = 360 / count;
                        return (
                            <div 
                                key={i}
                                className="absolute top-0 left-1/2 w-1/2 h-full origin-left flex items-center justify-center"
                                style={{ 
                                    backgroundColor: opt.color,
                                    transform: `rotate(${i * degree}deg) skewY(${90 - degree}deg)`
                                }}
                            >
                                {/* Texto da fatia (precisa de contra-rotação para ficar legível) */}
                                <div 
                                    className="absolute left-4 w-24 text-[10px] font-black text-white text-center uppercase tracking-tighter"
                                    style={{ 
                                        transform: `skewY(-${90 - degree}deg) rotate(${degree / 2}deg)`,
                                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    {opt.label}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Centro da Roda */}
                    <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-16 h-16 bg-white rounded-full shadow-2xl z-10 border-4 border-slate-50 flex items-center justify-center">
                            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
                                <Trophy size={20} />
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                {result ? (
                    <div className="animate-bounce">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Você ganhou:</p>
                        <p className={`text-2xl font-black ${result.type === 'LOSE' ? 'text-slate-400' : 'text-emerald-500'}`}>
                            {result.label}
                        </p>
                    </div>
                ) : (
                    <button 
                        onClick={spin}
                        disabled={isSpinning}
                        className="w-full bg-purple-600 text-white py-4 rounded-xl text-sm font-black tracking-widest hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50 disabled:grayscale"
                    >
                        {isSpinning ? <Loader2 className="animate-spin mx-auto" /> : "GIRAR AGORA!"}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
