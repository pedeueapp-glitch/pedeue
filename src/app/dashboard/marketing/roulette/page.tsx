"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Sparkles, 
  DollarSign,
  Percent,
  Truck,
  XCircle,
  Palette,
  Play
} from "lucide-react";
import toast from "react-hot-toast";
import RouletteModal from "@/components/RouletteModal";

interface RouletteOption {
  label: string;
  value: string;
  type: "PERCENT" | "FIXED" | "FREE_DELIVERY" | "LOSE";
  weight: number;
  color: string;
}

export default function RouletteConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [config, setConfig] = useState({
    active: false,
    minOrderValue: 50,
    options: [] as RouletteOption[]
  });

  useEffect(() => {
    fetch("/api/store/roulette")
      .then(r => r.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/store/roulette", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (!res.ok) throw new Error();
      toast.success("Configuração salva com sucesso!");
    } catch {
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const testRoulette = () => {
    if (config.options.length === 0) return toast.error("Adicione opções para testar");
    setTestMode(true);
  };

  const addOption = () => {
    const newOption: RouletteOption = {
      label: "Novo Prêmio",
      value: "5",
      type: "PERCENT",
      weight: 10,
      color: "#" + Math.floor(Math.random()*16777215).toString(16)
    };
    setConfig({ ...config, options: [...config.options, newOption] });
  };

  const removeOption = (index: number) => {
    const newOptions = [...config.options];
    newOptions.splice(index, 1);
    setConfig({ ...config, options: newOptions });
  };

  const updateOption = (index: number, data: Partial<RouletteOption>) => {
    const newOptions = [...config.options];
    newOptions[index] = { ...newOptions[index], ...data };
    setConfig({ ...config, options: newOptions });
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

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-20">
      <Loader2 className="animate-spin text-purple-600" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-6 px-4 pb-20 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-purple-600 text-[9px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ferramenta de Marketing</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Roleta da Sorte</h1>
          <p className="text-slate-400 text-xs font-medium">Configure prêmios e gamificação para seus clientes.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={testRoulette}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
          >
            <Play size={16} />
            TESTAR ROLETA
          </button>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-black tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? "SALVANDO..." : "SALVAR CONFIGURAÇÃO"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Regras Gerais</h3>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Ativar Roleta</p>
                    <p className="text-[9px] text-slate-400 font-medium">Exibir para os clientes no checkout</p>
                 </div>
                 <button 
                  onClick={() => setConfig({...config, active: !config.active})}
                  className={`w-12 h-6 rounded-full transition-all relative ${config.active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                 >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.active ? 'left-7' : 'left-1'}`} />
                 </button>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Mínimo (R$)</label>
                 <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="number"
                      className="input-field !py-2.5 pl-9 text-sm"
                      value={config.minOrderValue}
                      onChange={e => setConfig({...config, minOrderValue: parseFloat(e.target.value) || 0})}
                      placeholder="Ex: 50.00"
                    />
                 </div>
                 <p className="text-[9px] text-slate-400 font-medium italic">A roleta aparecerá quando o carrinho atingir este valor.</p>
              </div>
           </div>

           {/* Visual da Roleta SVG */}
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Visualização</h3>
              <div className="relative aspect-square w-full max-w-[280px] mx-auto">
                 {/* Seta Indicadora */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                    <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-red-500 drop-shadow-md"></div>
                 </div>
                 
                 <div className="w-full h-full">
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-xl">
                        {config.options.length > 0 ? config.options.map((opt, i) => {
                            const count = config.options.length;
                            const step = 360 / count;
                            const startAngle = i * step;
                            const endAngle = (i + 1) * step;
                            
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
                                        fontSize="3" 
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
                        }) : (
                          <circle cx="50" cy="50" r="48" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 2" />
                        )}
                    </svg>
                 </div>

                 {/* Botão Central */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-full shadow-lg z-10 border-4 border-slate-50 flex items-center justify-center">
                       <Sparkles size={20} className="text-purple-500" />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Opções da Roleta</h3>
              <button 
                onClick={addOption}
                className="flex items-center gap-2 text-[10px] font-black text-purple-600 bg-purple-50 px-4 py-2 rounded-xl hover:bg-purple-100 transition-all border border-purple-100"
              >
                <Plus size={14} />
                ADICIONAR OPÇÃO
              </button>
           </div>

           <div className="space-y-3">
              {config.options.map((opt, index) => (
                 <div key={index} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center animate-in slide-in-from-right-2 duration-300">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-[2fr_1.2fr_1.2fr_auto] gap-4 w-full items-center">
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rótulo (Texto)</label>
                          <input 
                            className="input-field !py-2 text-xs" 
                            value={opt.label} 
                            onChange={e => updateOption(index, { label: e.target.value })}
                            placeholder="Ex: 15% OFF"
                          />
                       </div>
                       
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tipo</label>
                          <select 
                            className="input-field !py-2 text-xs bg-white"
                            value={opt.type}
                            onChange={e => updateOption(index, { type: e.target.value as any })}
                          >
                             <option value="PERCENT">% Desconto</option>
                             <option value="FIXED">R$ Desconto</option>
                             <option value="FREE_DELIVERY">Taxa Grátis</option>
                             <option value="LOSE">Não foi desta vez</option>
                          </select>
                       </div>

                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Valor / Peso (%)</label>
                          <div className="flex gap-2">
                             <input 
                               type="number"
                               className="input-field !py-2 text-xs w-1/2" 
                               value={opt.value} 
                               onChange={e => updateOption(index, { value: e.target.value })}
                               disabled={opt.type === 'FREE_DELIVERY' || opt.type === 'LOSE'}
                             />
                             <input 
                               type="number"
                               className="input-field !py-2 text-xs w-1/2 border-purple-100" 
                               value={opt.weight} 
                               title="Probabilidade (Peso)"
                               onChange={e => updateOption(index, { weight: parseInt(e.target.value) || 0 })}
                             />
                          </div>
                       </div>

                        <div className="flex flex-col items-center gap-1">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cor</label>
                           <input 
                             type="color"
                             className="w-8 h-8 rounded-lg cursor-pointer border-2 border-white shadow-sm ring-1 ring-slate-200" 
                             value={opt.color} 
                             onChange={e => updateOption(index, { color: e.target.value })}
                           />
                        </div>
                    </div>

                    <button 
                        onClick={() => removeOption(index)}
                        className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                 </div>
              ))}

              {config.options.length === 0 && (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                   <Settings className="mx-auto text-slate-300 mb-2" size={32} />
                   <p className="text-xs font-bold text-slate-400 uppercase">Nenhuma opção configurada</p>
                </div>
              )}
           </div>
        </div>
      </div>

      <RouletteModal 
        isOpen={testMode}
        onClose={() => setTestMode(false)}
        config={{ ...config, active: true }}
        onWin={(prize) => {
          toast.success(`Teste: Ganhou ${prize.label}`);
          setTimeout(() => setTestMode(false), 2000);
        }}
      />
    </div>
  );
}
