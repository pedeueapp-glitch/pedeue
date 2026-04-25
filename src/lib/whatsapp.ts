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
  msg += `*WhatsApp:* ${order.customerPhone}\n\n`;

  msg += `*--- ITENS DO PEDIDO ---*\n`;
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any) => {
      msg += `• ${item.quantity}x ${item.productName || item.product?.name}`;
      if (item.price) {
        msg += ` (R$ ${(item.price * item.quantity).toFixed(2).replace(".", ",")})`;
      }
      msg += `\n`;
      
      // Se houver adicionais/opções
      if (item.options && item.options.length > 0) {
        item.options.forEach((opt: any) => {
          msg += `  └ ${opt.name || opt.option?.name}\n`;
        });
      }
    });
  }
  msg += `\n`;

  msg += `*--- RESUMO ---*\n`;
  if (order.subtotal) msg += `*Subtotal:* R$ ${order.subtotal.toFixed(2).replace(".", ",")}\n`;
  if (order.deliveryFee > 0) msg += `*Taxa de Entrega:* R$ ${order.deliveryFee.toFixed(2).replace(".", ",")}\n`;
  if (order.discount > 0) msg += `*Desconto:* - R$ ${order.discount.toFixed(2).replace(".", ",")}\n`;
  msg += `*Total:* R$ ${order.total.toFixed(2).replace(".", ",")}\n\n`;

  msg += `*Pagamento:* ${order.paymentMethod.toUpperCase()}\n`;
  
  // Lógica de Troco
  if (order.paymentMethod.toUpperCase() === "DINHEIRO" || order.paymentMethod.toUpperCase() === "CASH") {
    if (order.change && order.change > order.total) {
      const trocoVal = order.change - order.total;
      msg += `*Levar troco para:* R$ ${order.change.toFixed(2).replace(".", ",")}\n`;
      msg += `*Troco:* R$ ${trocoVal.toFixed(2).replace(".", ",")}\n`;
    } else {
      msg += `*Troco:* Não necessário\n`;
    }
  }
  msg += `\n`;

  if (order.deliveryType === "DELIVERY") {
    msg += `*Tipo:* Entrega\n`;
    msg += `*Endereço:* ${order.street}, ${order.number}\n`;
    if (order.neighborhood) msg += `*Bairro:* ${order.neighborhood}\n`;
    if (order.reference) msg += `*Referência:* ${order.reference}\n`;
  } else {
    msg += `*Tipo:* Retirada\n`;
  }

  if (order.observations) {
    msg += `\n*Observações:* ${order.observations}\n`;
  }

  msg += `\n-------------------------------------\n`;
  msg += `_Pedido realizado via PedeUe.com Delivery_`;

  return msg;
}
