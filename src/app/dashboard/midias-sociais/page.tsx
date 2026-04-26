"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download, Store, QrCode, Loader2, Star, MessageSquare, Smartphone,
  Share2, Camera, CheckCircle2
} from "lucide-react";
import { toPng } from "html-to-image";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";

const FEEDBACKS = [
  "Superou minhas expectativas! 🚀",
  "O melhor da cidade, sem dúvidas. ⭐",
  "Entrega super rápida e comida quentinha! 🛵",
  "Atendimento nota 10! Parabéns.",
  "A qualidade é incomparável. Recomendo!",
  "Virei fã, tudo impecável! ❤️",
  "Sabor inesquecível, parabéns à equipe.",
  "Simplesmente viciante! 😍",
  "Minha escolha favorita sempre!",
  "Surpreendente do início ao fim."
];

const OPEN_MODELS = [
  { id: "on", title: "ESTAMOS ON!", sub: "Faça seu pedido" },
  { id: "aberto", title: "ABERTOS", sub: "Já estamos atendendo" },
  { id: "vem", title: "VEM QUE TEM!", sub: "Peça agora" },
  { id: "esperando", title: "TE ESPERANDO", sub: "Faça seu dia melhor" },
  { id: "bora", title: "SÓ VEM!", sub: "O melhor da região" }
];

export default function SocialMediaPage() {
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  const [selectedOpen, setSelectedOpen] = useState(OPEN_MODELS[0]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedFeedback, setSelectedFeedback] = useState(FEEDBACKS[0]);

  // States para imagens convertidas em Base64
  const [logoB64, setLogoB64] = useState<string | null>(null);
  const [productB64, setProductB64] = useState<string | null>(null);

  const artRefs = {
    open: useRef<HTMLDivElement>(null),
    promo: useRef<HTMLDivElement>(null),
    feedback: useRef<HTMLDivElement>(null),
  };

  // Converte imagem para Base64 com inteligência de rota
  const fetchImageAsBase64 = async (url: string) => {
    if (!url) return null;
    try {
      // Se a imagem for local (uploads), não precisa de proxy para capturar o canvas
      // Mas converter para base64 garante que o html-to-image não tenha problemas
      const targetUrl = url.startsWith('http')
        ? `/api/proxy-image?url=${encodeURIComponent(url)}`
        : url;

      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error("Failed to fetch");

      const blob = await res.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Fallback para URL normal:", url);
      return url; // Se der erro no base64, tenta usar a URL original
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [sRes, pRes] = await Promise.all([fetch("/api/store"), fetch("/api/products")]);
        const sData = await sRes.json();
        const pData = await pRes.json();
        setStore(sData);
        setProducts(pData);

        if (sData.logo) {
          const b64 = await fetchImageAsBase64(sData.logo);
          setLogoB64(b64);
        }

        if (pData.length > 0) {
          const firstProd = pData[0];
          setSelectedProduct(firstProd);
          if (firstProd.imageUrl) {
            const b64 = await fetchImageAsBase64(firstProd.imageUrl);
            setProductB64(b64);
          }
        }
      } catch (err) {
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Atualiza foto do produto ao mudar seleção
  useEffect(() => {
    if (selectedProduct?.imageUrl) {
      fetchImageAsBase64(selectedProduct.imageUrl).then(setProductB64);
    } else {
      setProductB64(null);
    }
  }, [selectedProduct]);

  const downloadArt = async (id: keyof typeof artRefs, name: string) => {
    const ref = artRefs[id].current;
    if (!ref) return;

    setDownloading(id);
    const toastId = toast.loading("Gerando imagem HD...");

    try {
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 1200));

      const dataUrl = await toPng(ref, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      if (!dataUrl || dataUrl.length < 200) throw new Error("Imagem gerada inválida");

      const link = document.createElement("a");
      link.download = `pedeue-${name}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download iniciado!", { id: toastId });
    } catch (err: any) {
      console.error("Falha no download:", err);
      toast.error("O navegador bloqueou a captura. Tente recarregar a página.", { id: toastId });
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-500" /></div>;

  const brandColor = store?.primaryColor || "#f97316";

  return (
    <>
      <Header title="Estúdio de Marketing" />

      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-16">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* TEMPLATE 1: ESTAMOS ON */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-[10px] font-black text-navy uppercase tracking-widest leading-none">01. Alerta de Abertura</h3>
                <select className="mt-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-2 outline-none" onChange={(e) => setSelectedOpen(OPEN_MODELS.find(m => m.id === e.target.value)!)} value={selectedOpen.id}>
                  {OPEN_MODELS.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <button onClick={() => downloadArt("open", "Abertura")} disabled={!!downloading} className="bg-navy text-white py-2 px-6 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 shadow-lg">
                {downloading === "open" ? <Loader2 className="animate-spin w-3 h-3" /> : "Baixar"}
              </button>
            </div>

            <div className="flex justify-center bg-slate-100 p-4 sm:p-8 rounded-xl border border-slate-200 shadow-inner">
              <div ref={artRefs.open} className="w-[360px] h-[640px] bg-white relative flex flex-col items-center justify-between p-0 overflow-hidden shadow-2xl rounded-none">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(${brandColor} 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />
                <div className="w-full h-[45%] flex flex-col items-center justify-center relative" style={{ backgroundColor: brandColor }}>
                  <div className="absolute -bottom-10 w-[120%] h-20 bg-white -rotate-3 translate-y-2" />
                  <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center border-4 border-white shadow-2xl mb-4 p-1 z-10 overflow-hidden">
                    {logoB64 ? <img src={logoB64} className="w-full h-full object-cover" alt="logo" /> : <Store style={{ color: brandColor }} size={48} />}
                  </div>
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-10 text-center">
                  <h1 className="text-5xl font-black text-navy leading-none uppercase tracking-tighter mb-4" style={{ fontStyle: 'normal' }}>
                    {selectedOpen.title.split(' ')[0]}<br /><span style={{ color: brandColor }}>{selectedOpen.title.split(' ').slice(1).join(' ')}</span>
                  </h1>
                  <div className="w-12 h-1 bg-navy rounded-full mb-6" />
                  <p className="text-xl font-black text-slate-400 uppercase tracking-widest leading-tight" style={{ fontStyle: 'normal' }}>{selectedOpen.sub}</p>
                </div>
                <div className="relative z-10 w-full px-10 pb-12">
                  <div className="bg-navy text-white w-full py-6 rounded-xl shadow-2xl flex flex-col items-center text-center">
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Acesse pelo link</p>
                    <p className="text-[11px] font-black tracking-widest uppercase">{store?.slug}.pedeue.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TEMPLATE 2: PRODUTO */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex-1 mr-4">
                <h3 className="text-[10px] font-black text-navy uppercase tracking-widest leading-none">02. Oferta do Dia</h3>
                <select className="mt-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-2 outline-none w-full" onChange={(e) => setSelectedProduct(products.find(p => p.id === e.target.value))} value={selectedProduct?.id}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <button onClick={() => downloadArt("promo", "Oferta")} disabled={!!downloading} className="bg-navy text-white py-2 px-6 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 shadow-lg">
                {downloading === "promo" ? <Loader2 className="animate-spin w-3 h-3" /> : "Baixar"}
              </button>
            </div>

            <div className="flex justify-center bg-slate-100 p-4 sm:p-8 rounded-xl border border-slate-200 shadow-inner">
              <div ref={artRefs.promo} className="w-[360px] h-[640px] bg-slate-50 relative flex flex-col items-center shadow-2xl rounded-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[55%] rounded-b-none shadow-xl" style={{ backgroundColor: brandColor }} />
                <div className="relative z-10 w-full flex flex-col items-center px-10 pt-16 h-full justify-between pb-12">
                  <div className="bg-navy/20 px-5 py-2 rounded-full text-white text-[11px] font-black uppercase tracking-[0.3em] mb-4 border border-white/30">Ofertas do Dia</div>
                  <div className="w-full aspect-square bg-white rounded-xl overflow-hidden shadow-2xl border-[6px] border-white z-20">
                    {productB64 ? <img src={productB64} className="w-full h-full object-cover" alt="produto" /> : <Store size={64} className="text-slate-100 mx-auto mt-20" />}
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4 pt-6 text-center">
                    <h2 className="text-3xl font-black text-slate-900 leading-none uppercase tracking-tighter line-clamp-2" style={{ fontStyle: 'normal' }}>{selectedProduct?.name}</h2>
                    <div className="bg-navy text-white px-8 py-3 rounded-xl shadow-2xl flex items-baseline gap-2 border border-white/20">
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">R$</span>
                      <span className="text-4xl font-black tracking-tighter" style={{ fontStyle: 'normal' }}>{selectedProduct?.price?.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                  <div className="w-full flex flex-col items-center pt-4">
                    <p className="text-3xl font-black text-navy uppercase tracking-widest mb-1" style={{ fontStyle: 'normal' }}>Peça já!</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{store?.slug}.pedeue.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TEMPLATE 3: FEEDBACK */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex-1 mr-4">
                <h3 className="text-[10px] font-black text-navy uppercase tracking-widest leading-none">03. Feedback Cliente</h3>
                <select className="mt-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-2 outline-none w-full" onChange={(e) => setSelectedFeedback(e.target.value)} value={selectedFeedback}>
                  {FEEDBACKS.map((f, i) => <option key={i} value={f}>{f.substring(0, 30)}...</option>)}
                </select>
              </div>
              <button onClick={() => downloadArt("feedback", "Feedback")} disabled={!!downloading} className="bg-navy text-white py-2 px-6 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 shadow-lg">
                {downloading === "feedback" ? <Loader2 className="animate-spin w-3 h-3" /> : "Baixar"}
              </button>
            </div>

            <div className="flex justify-center bg-slate-100 p-4 sm:p-8 rounded-xl border border-slate-200 shadow-inner">
              <div ref={artRefs.feedback} className="w-[360px] h-[640px] bg-white relative flex flex-col items-center justify-between p-0 overflow-hidden shadow-2xl rounded-none">
                <div className="w-full h-2" style={{ backgroundColor: brandColor }} />
                <div className="flex flex-col items-center text-center py-10 px-6 h-full justify-between">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-navy mb-6">
                      <MessageSquare style={{ color: brandColor }} size={32} />
                    </div>
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill={brandColor} color={brandColor} />)}
                    </div>
                    <h2 className="text-3xl font-black text-navy uppercase tracking-tight leading-none mb-10" style={{ fontStyle: 'normal' }}>O QUE NOSSOS<br /><span style={{ color: brandColor }}>CLIENTES DIZEM</span></h2>
                    <div className="bg-slate-50 p-8 rounded-xl border border-slate-100 relative">
                      <p className="text-slate-700 text-lg font-black leading-tight uppercase tracking-tight" style={{ fontStyle: 'normal' }}>{selectedFeedback}</p>
                      <div className="absolute -top-4 left-6 bg-white px-2 text-slate-200 font-black text-5xl leading-none">“</div>
                    </div>
                  </div>
                  <div className="w-full bg-navy p-6 rounded-xl flex items-center justify-between shadow-xl text-left">
                    <div>
                      <p className="text-white text-xs font-black uppercase tracking-widest" style={{ fontStyle: 'normal' }}>{store?.name}</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase">{store?.slug}.pedeue.com</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-lg p-1 overflow-hidden">
                      {logoB64 && <img src={logoB64} className="w-full h-full object-cover rounded-md" alt="logo" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      `}</style>
    </>
  );
}
