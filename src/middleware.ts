import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  const rootDomain = 'pedeue.com';
  // Rotas que DEVEM permanecer no domínio principal
  const mainRoutes = ['/dashboard', '/api', '/_next', '/entrar', '/cadastrar', '/recuperar-senha', '/superadmin', '/favicon.ico', '/painel-afiliado', '/contato-suporte'];
  const reservedSubdomains = ['www', 'api', 'admin', 'superadmin', 'dev', 'websocket'];
  
  const { pathname } = url;
  const isRsc = url.searchParams.has('_rsc');

  // Adicionar cabeçalhos CORS para permitir requisições cross-subdomain (importante para Next.js RSC)
  const corsHeaders = {
    'Access-Control-Allow-Origin': hostname.includes('localhost') ? '*' : `https://${rootDomain}`,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-nextjs-data, x-rsc, x-rsc-version',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers: corsHeaders });
  }
  const origin = hostname.includes('localhost') ? '*' : `https://${rootDomain}`;

  // 1. Ignorar arquivos estáticos e ativos
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // 2. Lógica para o Domínio Principal (pedeue.com)
  const isMainDomain = hostname === rootDomain || hostname === `www.${rootDomain}` || hostname.includes('localhost');
  
  if (isMainDomain) {
    return NextResponse.next();
    
    return NextResponse.next();
  }

  // 3. Lógica para Subdomínios (ex: loja.pedeue.com)
  const isSubdomain = hostname.endsWith(`.${rootDomain}`) && !hostname.startsWith('www.');
  
  if (isSubdomain) {
    const slug = hostname.split('.')[0];
    
    if (!reservedSubdomains.includes(slug)) {
      const res = NextResponse.rewrite(new URL(`/${slug}${pathname}`, request.url));
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Access-Control-Allow-Credentials', 'true');
      res.headers.set('Access-Control-Allow-Headers', 'x-nextjs-data, x-rsc, x-rsc-version');
      return res;
    }
  }

  // 4. Lógica para Domínios Customizados (ex: sualoja.com.br)
  if (!isMainDomain && !isSubdomain) {
    try {
      const resLookup = await fetch(`http://localhost:3000/api/domains/lookup?domain=${hostname}`);
      const data = await resLookup.json();

      if (data.slug) {
        const res = NextResponse.rewrite(new URL(`/${data.slug}${pathname}`, request.url));
        res.headers.set('Access-Control-Allow-Origin', origin);
        return res;
      }
    } catch (error) {
      console.error("Erro no lookup de domínio customizado:", error);
    }
  }

  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', origin);
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
