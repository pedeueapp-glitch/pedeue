import Link from "next/link";
import {
  ShoppingBag,
  MessageCircle,
  Store,
  ChefHat,
  Zap,
  Shield,
  Star,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">DeliveryMenu</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/entrar"
              className="text-gray-300 hover:text-white text-sm font-medium transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/cadastrar"
              className="btn-primary text-sm !py-2.5 !px-5"
            >
              Comece gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-4 py-2 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            Cardapio digital + Pedidos no WhatsApp
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 animate-fade-in">
            Seu cardapio online
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              em 5 minutos
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            Crie sua loja digital gratuita, cadastre seus produtos e receba
            pedidos formatados direto no seu WhatsApp. Sem comissoes, sem
            mensalidade inicial.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link href="/cadastrar" className="btn-primary text-base !py-4 !px-8 shadow-brand">
              Criar minha loja gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/loja/shallom-supermercado"
              className="btn-secondary text-base !py-4 !px-8 !bg-white/5 !text-white !border-white/10 hover:!bg-white/10"
            >
              Ver demo ao vivo
              <Store className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Tudo que voce precisa
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
            Uma plataforma completa para restaurantes, padarias e mercados
            gerenciarem seus pedidos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Store,
                title: "Cardapio digital bonito",
                desc: "Interface mobile-first que encanta seus clientes. Categorias organizadas, fotos dos produtos, busca rapida.",
                color: "from-orange-500/20 to-orange-600/10",
                iconColor: "text-orange-400",
              },
              {
                icon: MessageCircle,
                title: "Pedido no WhatsApp",
                desc: "O cliente faz o pedido no seu cardapio digital e o resumo completo cai direto no seu WhatsApp. Simples assim.",
                color: "from-green-500/20 to-green-600/10",
                iconColor: "text-green-400",
              },
              {
                icon: ChefHat,
                title: "Dashboard completo",
                desc: "Gerencie produtos, categorias, horarios e configuracoes da sua loja de um so lugar.",
                color: "from-blue-500/20 to-blue-600/10",
                iconColor: "text-blue-400",
              },
              {
                icon: Zap,
                title: "Ultra rapido",
                desc: "Carregamento instantaneo. Seus clientes nao ficam esperando, voce nao perde vendas.",
                color: "from-yellow-500/20 to-yellow-600/10",
                iconColor: "text-yellow-400",
              },
              {
                icon: Shield,
                title: "Dados isolados",
                desc: "Cada loja e completamente independente. Seus dados sao seus, com total privacidade e seguranca.",
                color: "from-purple-500/20 to-purple-600/10",
                iconColor: "text-purple-400",
              },
              {
                icon: Star,
                title: "Link personalizado",
                desc: "Sua loja tem um link unico ex: /loja/seu-restaurante. Compartilhe no Instagram, stories e grupos.",
                color: "from-pink-500/20 to-pink-600/10",
                iconColor: "text-pink-400",
              },
            ].map((feat, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl bg-gradient-to-br ${feat.color} border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4`}>
                  <feat.icon className={`w-6 h-6 ${feat.iconColor}`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{feat.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Planos simples e transparentes
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Sem taxas escondidas. Sem comissao por pedido.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl border border-white/10 bg-white/5">
              <div className="text-gray-400 text-sm font-medium mb-2">GRATIS</div>
              <div className="text-4xl font-bold mb-1">R$ 0</div>
              <div className="text-gray-500 text-sm mb-6">Para sempre</div>
              {["1 loja", "Ate 20 produtos", "Link personalizado", "Pedidos via WhatsApp"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-gray-300 text-sm mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
              <Link href="/cadastrar" className="btn-secondary w-full mt-6 !bg-white/5 !text-white !border-white/10">
                Comecar gratis
              </Link>
            </div>

            <div className="p-8 rounded-2xl border border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-orange-600/5 relative">
              <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <div className="text-orange-400 text-sm font-medium mb-2">PRO</div>
              <div className="text-4xl font-bold mb-1">R$ 49</div>
              <div className="text-gray-500 text-sm mb-6">por mes</div>
              {[
                "Lojas ilimitadas",
                "Produtos ilimitados",
                "Upload de imagens",
                "Painel de pedidos",
                "Horario de funcionamento",
                "Suporte prioritario",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-gray-300 text-sm mb-3">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
              <Link href="/cadastrar" className="btn-primary w-full mt-6">
                Assinar agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Pronto para comecar?
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Mais de 1.200 lojas ja usam o DeliveryMenu para vender mais.
            Crie a sua em menos de 5 minutos.
          </p>
          <Link href="/cadastrar" className="btn-primary text-lg !py-5 !px-10 shadow-brand">
            Criar minha loja agora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">DeliveryMenu</span>
          </div>
          <p className="text-gray-500 text-sm">
            2024 DeliveryMenu. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
