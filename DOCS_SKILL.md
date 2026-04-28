# 🧠 PedeUe System Skill & Architecture Guide

Este documento serve como a "memória mestre" do projeto PedeUe. Ele consolida as regras de negócio, arquitetura técnica e padrões de desenvolvimento que devem ser seguidos rigorosamente.

## 🚀 1. Arquitetura Multi-Tenancy (Multi-Lojas)
O sistema opera com um único codebase para múltiplas lojas, utilizando subdomínios ou domínios customizados.

### 🛣️ Roteamento & Middleware (`src/middleware.ts`)
- **Domínio Principal (`pedeue.com`):** Gerencia Landing Page, Dashboard do Lojista, SuperAdmin e Afiliados.
- **Subdomínios (`loja.pedeue.com`):** O middleware identifica o subdomínio (`loja`) e faz um `rewrite` interno para a rota dinâmica `src/app/[slug]`.
- **Rotas de Sistema (Main Routes):** Rotas como `/dashboard`, `/api`, `/superadmin`, `/afiliado` são **ignoradas** pelo redirecionamento de slug para que funcionem no domínio principal.

## 🏢 2. Tipos de Lojas (Store Types)
O sistema adapta sua interface e lógica baseado no campo `storeType` do banco de dados:

- **`RESTAURANT` (Cardápio Digital/Delivery):** 
  - Fluxo completo de pedidos com adicionais, observações e checkout.
  - Gestão de Mesas e Garçons ativa.
  - Taxas de entrega por bairro.
- **`SHOWCASE` (Vitrine):** 
  - Interface simplificada para exibição de produtos (Retail).
  - Oculta funções de mesas, garçons e taxas de entrega complexas.
  - Ideal para lojas de roupas, acessórios e varejo geral.
- **`SERVICE` (Serviços/Catálogo):**
  - Utiliza o `ServiceCatalog.tsx`.
  - Focado em orçamentos e agendamentos.
  - Permite campos personalizados para descrição de serviços.

## 💼 3. Papéis e Permissões (Roles)
- **MERCHANT (Lojista):** Acessa `/dashboard`. Possui uma loja vinculada.
- **AFFILIATE (Afiliado):** Acessa `/dashboard/afiliado`. Não possui loja. Ganha comissão vitalícia sobre indicações.
- **SUPERADMIN (Dono do SaaS):** Acessa `/superadmin`. Controla todo o ecossistema.

## 🛠️ 3. Componentes Críticos
- **`StorefrontClient.tsx`:** O motor da vitrine. Gerencia pedidos, carrinho e SSR. **Cuidado:** Ordem dos hooks (useEffect após useState) é vital para evitar ReferenceErrors no build de produção.
- **`PDVComponent.tsx`:** Interface de vendas em tempo real. Utiliza WebSockets (Socket.io) para novos pedidos.
- **`Sidebar.tsx`:** Navegação dinâmica baseada no `mode` (MERCHANT, AFFILIATE, SUPERADMIN).

## 🧹 4. Padrões de Organização (Clean Up Rules)
- **Idioma:** Preferência por nomes de arquivos e pastas em **Inglês** para rotas técnicas (`/products`, `/categories`).
- **Eliminação de Duplicatas:** Pastas em português (`/produtos`, `/categorias`) são versões legadas e devem ser removidas após migração.

## 🚢 5. Fluxo de Deploy (VPS)
- O deploy é feito via Docker Compose na VPS.
- **Comando de Reset:** `git fetch --all && git reset --hard origin/main` seguido de `docker compose build`.
- **Cache:** Use `--no-cache` apenas em mudanças estruturais pesadas ou problemas de cache persistentes.

---
*Este guia deve ser consultado antes de qualquer nova funcionalidade ou refatoração.*
