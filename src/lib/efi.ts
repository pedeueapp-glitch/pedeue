import Gerencianet from 'gn-api-sdk-node';
import fs from 'fs';
import path from 'path';

/**
 * Configuração da Efí (Gerencianet)
 * O certificado deve ser fornecido via EFI_CERTIFICATE_BASE64 no .env
 * ou estar fisicamente em /certs/efi-cert.p12
 */

// Tenta usar /tmp em ambientes serverless, caso contrário usa o diretório do projeto
const isServerless = process.env.VERCEL || process.env.NETLIFY;
const certDir = isServerless ? '/tmp' : path.join(process.cwd(), 'certs');
const certPath = path.join(certDir, 'efi-cert.p12');

if (process.env.EFI_CERTIFICATE_BASE64) {
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }
  fs.writeFileSync(certPath, Buffer.from(process.env.EFI_CERTIFICATE_BASE64, 'base64'));
}

const options = {
  sandbox: process.env.EFI_SANDBOX === 'true',
  client_id: process.env.EFI_CLIENT_ID || '',
  client_secret: process.env.EFI_CLIENT_SECRET || '',
  certificate: certPath,
};

const efi = new Gerencianet(options);

export default efi;

// Funções utilitárias para PIX
export async function createPixImmediateCharge(data: {
  amount: number;
  description: string;
  customer: {
    name: string;
    document: string;
  };
}) {
  // Limpa o CPF de qualquer caractere não numérico
  const cleanCpf = (data.customer.document || '').replace(/\D/g, '').trim();
  
  console.log(`DEBUG EFI - Gerando Pix para: ${data.customer.name}, CPF: ${cleanCpf}, Valor: ${data.amount}`);

  const body = {
    calendario: {
      expiracao: 3600 // 1 hora
    },
    devedor: {
      cpf: cleanCpf,
      nome: data.customer.name
    },
    valor: {
      original: data.amount.toFixed(2)
    },
    chave: process.env.EFI_PIX_KEY || '', // Sua chave Pix cadastrada na Efí
    solicitacaoPagador: data.description
  };

  try {
    const response = await efi.pixCreateImmediateCharge({}, body);
    
    // Gerar QR Code para a cobrança criada
    const qrcodeParams = {
      id: response.loc.id
    };
    const qrcodeResponse = await efi.pixGenerateQRCode(qrcodeParams);

    return {
      txid: response.txid,
      pixCopyPaste: qrcodeResponse.qrcode,
      pixImage: qrcodeResponse.imagemQrcode,
      locId: response.loc.id
    };
  } catch (error) {
    console.error('EFI PIX ERROR:', error);
    throw error;
  }
}

export async function sendPixPayment(data: {
  amount: number;
  pixKey: string;
  pixKeyType: string;
  description: string;
}) {
  console.log(`[EFI PIX SEND] Enviando R$${data.amount} para ${data.pixKey} (${data.pixKeyType})`);

  // Mapeamento de tipos de chave para o formato da EFI
  // EFI usa: cpf, cnpj, email, celular, evp (chave aleatória)
  const keyTypeMap: Record<string, string> = {
    "CPF": "cpf",
    "CNPJ": "cnpj",
    "EMAIL": "email",
    "PHONE": "celular",
    "RANDOM": "evp"
  };

  const payerKey = process.env.EFI_PIX_KEY || "";
  const cleanKey = data.pixKey.replace(/[^\w@.+-]/g, "");

  const body = {
    valor: data.amount.toFixed(2),
    pagador: {
      chave: payerKey
    },
    favorecido: {
      chave: cleanKey
    }
  };

  try {
    // A API de transferência PIX da EFI exige um idEnvio único (txid de envio)
    const idEnvio = "P" + Date.now() + Math.floor(Math.random() * 1000);
    const params = {
        idEnvio: idEnvio
    };

    const response = await efi.pixSend(params, body);
    return { ...response, idEnvio };
  } catch (error) {
    console.error('EFI PIX SEND ERROR:', error);
    throw error;
  }
}

export async function getPixTransferStatus(idEnvio: string) {
  try {
    const params = { idEnvio };
    const response = await efi.pixDetailSend(params);
    return response;
  } catch (error) {
    console.error('EFI PIX TRANSFER STATUS ERROR:', error);
    throw error;
  }
}

export async function getPixChargeStatus(txid: string) {
  try {
    const params = { txid };
    const response = await efi.pixDetailCharge(params);
    return response;
  } catch (error) {
    console.error('EFI PIX STATUS ERROR:', error);
    throw error;
  }
}

