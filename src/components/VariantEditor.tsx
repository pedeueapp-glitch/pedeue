"use client";

import { useState, useEffect } from "react";
import { X, Plus, Palette, Trash2, Camera, Package, Ruler, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const SIZE_PRESETS = {
  clothes: ["PP", "P", "M", "G", "GG", "XGG"],
  shoes: ["33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"],
  accessories: ["Único", "P", "M", "G"]
};

interface Variant {
  id?: string;
  color: string;
  colorHex: string;
  sizes: string[];
  imageUrl?: string;
  stock: number;
  barcode?: string;
}

interface VariantEditorProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

export function VariantEditor({ productId, productName, onClose }: VariantEditorProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [sizePreset, setSizePreset] = useState<keyof typeof SIZE_PRESETS>("clothes");

  const emptyVariant = (): Variant => ({
    color: "",
    colorHex: "#000000",
    sizes: [],
    imageUrl: "",
    stock: 0,
    barcode: ""
  });

  const [draft, setDraft] = useState<Variant>(emptyVariant());

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  async function fetchVariants() {
    setLoading(true);
    const res = await fetch(`/api/products/variants?productId=${productId}`);
    if (res.ok) setVariants(await res.json());
    setLoading(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("draft");
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) setDraft(d => ({ ...d, imageUrl: data.url }));
    setUploading(null);
  }

  function toggleSize(size: string) {
    setDraft(d => ({
      ...d,
      sizes: d.sizes.includes(size) ? d.sizes.filter(s => s !== size) : [...d.sizes, size]
    }));
  }

  async function saveVariant() {
    if (!draft.color) return toast.error("Informe o nome da cor");
    if (draft.sizes.length === 0) return toast.error("Selecione ao menos um tamanho");

    const res = await fetch("/api/products/variants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, productId })
    });

    if (!res.ok) return toast.error("Erro ao salvar");
    toast.success("Variante adicionada!");
    setDraft(emptyVariant());
    fetchVariants();
  }

  async function deleteVariant(id: string) {
    await fetch(`/api/products/variants?id=${id}`, { method: "DELETE" });
    fetchVariants();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-none flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-[#0f172a] text-white p-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Variações de Cor</h2>
            <p className="text-orange-500 text-[10px] font-bold uppercase mt-1">{productName}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-none text-white border-none">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* COLUNA ESQUERDA: Adicionar nova variante */}
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 border border-slate-100 space-y-5">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nova Variação de Cor</h3>

              {/* Nome + Cor */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Nome da Cor</p>
                  <input
                    className="w-full bg-white border border-slate-200 p-3 rounded-none text-xs font-bold uppercase outline-none"
                    placeholder="EX: PRETO FOSCO"
                    value={draft.color}
                    onChange={e => setDraft(d => ({ ...d, color: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Cor (Hex)</p>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-10 h-10 rounded-none border border-slate-200 cursor-pointer" value={draft.colorHex} onChange={e => setDraft(d => ({ ...d, colorHex: e.target.value }))} />
                    <input className="flex-1 bg-white border border-slate-200 p-3 rounded-none text-xs font-bold outline-none uppercase" value={draft.colorHex} onChange={e => setDraft(d => ({ ...d, colorHex: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Upload imagem da variante */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase">Foto desta Cor (WebP auto)</p>
                <label className="block border-2 border-dashed border-slate-200 p-5 text-center cursor-pointer hover:border-orange-400 transition-all">
                  <div className="flex items-center justify-center gap-4">
                    {draft.imageUrl ? (
                      <img src={draft.imageUrl} className="w-16 h-16 object-cover rounded-none" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded-none">
                        {uploading === "draft" ? <Loader2 size={20} className="animate-spin text-orange-500" /> : <Camera size={24} className="text-slate-300" />}
                      </div>
                    )}
                    <p className="text-xs font-bold text-slate-400">{uploading === "draft" ? "Enviando..." : "Clique para enviar foto"}</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>

              {/* Preset de tamanhos */}
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(SIZE_PRESETS) as Array<keyof typeof SIZE_PRESETS>).map(p => (
                    <button key={p} onClick={() => setSizePreset(p)} className={`px-3 py-1 text-[9px] font-black uppercase rounded-none border transition-all ${sizePreset === p ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {p === "clothes" ? "Roupas" : p === "shoes" ? "Calçados" : "Acessórios"}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Tamanhos Disponíveis</p>
                <div className="flex flex-wrap gap-2">
                  {SIZE_PRESETS[sizePreset].map(size => (
                    <button key={size} onClick={() => toggleSize(size)} className={`w-12 h-12 text-[10px] font-black uppercase rounded-none border-2 transition-all ${draft.sizes.includes(size) ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estoque e Código de Barras */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Estoque (Qtd)</p>
                  <input type="number" className="w-full bg-white border border-slate-200 p-3 rounded-none text-xs font-bold outline-none" value={draft.stock} onChange={e => setDraft(d => ({ ...d, stock: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Código de Barras</p>
                  <input type="text" className="w-full bg-white border border-slate-200 p-3 rounded-none text-xs font-bold outline-none uppercase" placeholder="OPCIONAL" value={draft.barcode || ""} onChange={e => setDraft(d => ({ ...d, barcode: e.target.value }))} />
                </div>
              </div>

              <button onClick={saveVariant} className="w-full bg-orange-500 text-white py-4 rounded-none font-black text-xs uppercase tracking-widest border-none shadow-lg hover:brightness-110 transition-all">
                <Plus size={16} className="inline mr-2" /> Adicionar Variação
              </button>
            </div>
          </div>

          {/* COLUNA DIREITA: Variantes existentes */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">({variants.length}) Variações Cadastradas</h3>
            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-orange-500" size={24} /></div>
            ) : variants.length === 0 ? (
              <div className="text-center py-10 text-slate-300">
                <Palette size={40} className="mx-auto mb-2" />
                <p className="text-xs font-bold uppercase">Nenhuma variante cadastrada</p>
              </div>
            ) : (
              variants.map(v => (
                <div key={v.id} className="bg-white border border-slate-100 p-5 flex items-center gap-4 group">
                  {/* Preview cor */}
                  <div className="relative flex-shrink-0">
                    {v.imageUrl ? (
                      <img src={v.imageUrl} className="w-16 h-16 object-cover rounded-none border border-slate-100" />
                    ) : (
                      <div className="w-16 h-16 rounded-none border border-slate-100" style={{ backgroundColor: v.colorHex }} />
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white rounded-none" style={{ backgroundColor: v.colorHex }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 uppercase text-sm">{v.color}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {v.sizes.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-none">{s}</span>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">Estoque: {v.stock} unidades</p>
                  </div>
                  <button onClick={() => v.id && deleteVariant(v.id)} className="text-slate-200 hover:text-red-500 transition-all border-none">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
