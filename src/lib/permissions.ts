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
  | 'AUTO_PRINT';

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
  AUTO_PRINT: "A impressão automática requer um plano com suporte a hardware."
};
