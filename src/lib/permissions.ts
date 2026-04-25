/**
 * Tipos de funcionalidades que podem ser bloqueadas/liberadas por plano
 */
export type PlanFeature = 
  | 'PDV_SYSTEM'
  | 'TABLE_MANAGEMENT'
  | 'DIGITAL_MENU'
  | 'CASHBACK_SYSTEM'
  | 'COUPON_SYSTEM'
  | 'REPORTS'
  | 'CUSTOM_COLOR'
  | 'AUTO_PRINT'
  | 'WAITER_APP'
  | 'DELIVERY_SYSTEM'
  | 'PRODUCT_DUPLICATION'
  | 'CUSTOM_DOMAIN'
  | 'ADVANCED_CATALOGS'
  | 'UPSELL_RULES'
  | 'HEATMAP';

/**
 * Verifica se um plano (em formato JSON string ou objeto) possui uma funcionalidade ativa
 */
export function hasFeature(planFeatures: any, feature: PlanFeature): boolean {
  if (!planFeatures) return false;
  
  let features = planFeatures;
  
  if (typeof planFeatures === 'string') {
    try {
      features = JSON.parse(planFeatures);
    } catch (e) {
      return false;
    }
  }

  return !!features[feature];
}

/**
 * Mensagens amigáveis para quando um recurso está bloqueado
 */
export const FEATURE_MESSAGES: Record<PlanFeature, string> = {
  PDV_SYSTEM: "O PDV Profissional não está disponível no seu plano atual.",
  TABLE_MANAGEMENT: "A gestão de mesas e comandas é um recurso exclusivo de planos superiores.",
  DIGITAL_MENU: "O cardápio online para delivery não está ativo no seu plano.",
  CASHBACK_SYSTEM: "O sistema de fidelidade via Cashback não está incluso no seu plano.",
  COUPON_SYSTEM: "A criação de cupons de desconto é um recurso bloqueado.",
  REPORTS: "Relatórios avançados e insights financeiros não estão disponíveis.",
  CUSTOM_COLOR: "A personalização visual da loja é um recurso premium.",
  AUTO_PRINT: "A impressão automática requer um plano com suporte a hardware.",
  WAITER_APP: "O App do Garçom é uma ferramenta para aumentar a produtividade, disponível em planos superiores.",
  DELIVERY_SYSTEM: "O sistema de delivery e logística de entregas não está ativo.",
  PRODUCT_DUPLICATION: "A duplicação inteligente de produtos é um recurso de produtividade premium.",
  CUSTOM_DOMAIN: "O uso de domínio personalizado (seu-site.com) é um recurso exclusivo.",
  ADVANCED_CATALOGS: "Os modos Vitrine e Serviços estão bloqueados no seu plano.",
  UPSELL_RULES: "Regras de venda cruzada (Upsell) são ferramentas avançadas de marketing.",
  HEATMAP: "O recurso de mapa de calor está disponível apenas em planos avançados.",
};
