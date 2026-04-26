import Gerencianet from 'gn-api-sdk-node';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Configuração da Efí (Gerencianet)
 * O certificado deve ser fornecido via EFI_CERTIFICATE_BASE64 no .env
 * ou estar fisicamente em /certs/efi-cert.p12
 */

// Tenta usar /tmp em ambientes serverless, caso contrário usa o diretório do projeto
const isServerless = process.env.VERCEL || process.env.NETLIFY;
const certDir = isServerless ? '/tmp' : path.join(process.cwd(), 'certs');
const certPath = path.join(certDir, 'efi-cert.p12');

// Se o certificado estiver em Base64 no ENV, salva no arquivo temporário (necessário para o SDK)
if (process.env.EFI_CERTIFICATE_BASE64) {
  try {
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }
    fs.writeFileSync(certPath, Buffer.from(process.env.EFI_CERTIFICATE_BASE64, 'base64'));
    console.log("DEBUG EFI - Certificado salvo com sucesso em:", certPath);
  } catch (err) {
    console.error("DEBUG EFI - Erro ao salvar certificado no disco:", err);
  }
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

/**
 * Envia um PIX da conta Efí para uma chave PIX de destino (Outbound)
 */
export async function sendPixOutbound(data: {
  amount: number;
  pixKey: string;
  description?: string;
}) {
  console.log(`DEBUG EFI - Iniciando transferência PIX para: ${data.pixKey}, Valor: R$ ${data.amount.toFixed(2)}`);

  const body = {
    valor: data.amount.toFixed(2),
    chave: data.pixKey
  };

  try {
    // O idEnvio deve ser um identificador único para cada tentativa de envio, 
    // com até 35 caracteres alfanuméricos.
    const idEnvio = crypto.randomUUID().replace(/-/g, '');
    const params = { idEnvio };

    // Nota: O método pixSend requer que a aplicação tenha o escopo 'pix.write' e 'pix.send' habilitados na Efí.
    console.log(`DEBUG EFI - Params: ${JSON.stringify(params)}`);
    console.log(`DEBUG EFI - Body: ${JSON.stringify(body)}`);
    const response = await efi.pixSend(params, body);
    console.log("DEBUG EFI - Resposta recebida:", JSON.stringify(response));
    return response;
  } catch (error: any) {
    console.error('EFI PIX SEND ERROR:', JSON.stringify(error));
    throw error;
  }
}


