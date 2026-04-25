const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

interface SendMessageParams {
  instance: string;
  number: string;
  text: string;
}

/**
 * Envia uma mensagem de texto via Evolution API
 */
export async function sendWhatsAppMessage({ instance, number, text }: SendMessageParams) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.warn("WHATSAPP SERVICE: Evolution API não configurada corretamente.");
    return { success: false, error: "Configuração ausente" };
  }

  // Limpar o número (remover caracteres não numéricos)
  // Adicionar código do país se não houver (exemplo: 55 para Brasil)
  let cleanNumber = number.replace(/\D/g, "");
  if (cleanNumber.length <= 11) {
    cleanNumber = `55${cleanNumber}`;
  }

  const url = `${EVOLUTION_API_URL}/message/sendText/${instance}`;

  const body = {
    number: cleanNumber,
    options: {
      delay: 1200,
      presence: "composing",
      linkPreview: false
    },
    textMessage: {
      text: text
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`WHATSAPP ERROR [${instance}]:`, data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error(`WHATSAPP FETCH ERROR [${instance}]:`, error);
    return { success: false, error };
  }
}

/**
 * Formata a mensagem de pedido para envio
 */
export function formatOrderMessage(order: any, storeName: string) {
  let msg = `*NOVO PEDIDO #${order.orderNumber}*\n`;
  msg += `*Loja:* ${storeName}\n\n`;
  
  msg += `*Cliente:* ${order.customerName}\n`;
  msg += `*Total:* R$ ${order.total.toFixed(2).replace(".", ",")}\n`;
  msg += `*Pagamento:* ${order.paymentMethod.toUpperCase()}\n\n`;

  if (order.deliveryType === "DELIVERY") {
    msg += `*Tipo:* Entrega\n`;
    msg += `*Endereço:* ${order.street}, ${order.number}\n`;
    if (order.neighborhood) msg += `*Bairro:* ${order.neighborhood}\n`;
  } else {
    msg += `*Tipo:* Retirada\n`;
  }

  msg += `\n-------------------------------------\n`;
  msg += `_Pedido realizado via PedeUe.com Delivery_`;

  return msg;
}
