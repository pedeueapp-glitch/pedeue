/**
 * Utilitários para geração de Pix Estático (BRCode)
 * Segue o padrão EMV QRCPS (Merchant Presented Mode)
 */

interface PixConfig {
  key: string;
  merchantName: string;
  merchantCity: string;
  amount?: number;
  description?: string;
  txid?: string;
}

export function generatePixPayload(config: PixConfig): string {
  const { key, merchantName, merchantCity, amount, description, txid = '***' } = config;

  // Normaliza nome e cidade (remove acentos e caracteres especiais para o padrão Pix)
  const cleanName = merchantName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9 ]/g, '');
  const cleanCity = merchantCity.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9 ]/g, '');

  // Formata o valor
  const amountStr = amount ? amount.toFixed(2) : '';

  // Partes do Payload
  const parts: Record<string, string> = {
    '00': '01', // Payload Format Indicator
    '26': '',   // Merchant Account Information (GUI + Key)
    '52': '0000', // Merchant Category Code
    '53': '986',  // Transaction Currency (BRL)
    '54': amountStr, // Transaction Amount
    '58': 'BR',   // Country Code
    '59': cleanName.slice(0, 25), // Merchant Name
    '60': cleanCity.slice(0, 15), // Merchant City
    '62': '',     // Additional Data Field (TXID)
  };

  // Monta a parte 26 (Merchant Account Information)
  const gui = 'br.gov.bcb.pix';
  const part26 = `00${gui.length.toString().padStart(2, '0')}${gui}01${key.length.toString().padStart(2, '0')}${key}`;
  parts['26'] = part26;

  // Monta a parte 62 (Additional Data Field)
  const part62 = `05${txid.length.toString().padStart(2, '0')}${txid}`;
  parts['62'] = part62;

  // Concatena as partes na ordem correta (00 deve ser a primeira)
  let payload = "";
  
  // 1. Tag 00 sempre primeiro
  const id00 = "00";
  const val00 = parts[id00];
  payload += `${id00}${val00.length.toString().padStart(2, "0")}${val00}`;

  // 2. Outras tags (exceto 00 e 63)
  for (const [id, value] of Object.entries(parts)) {
    if (id !== "00" && id !== "63" && value) {
       const cleanValue = value.trim();
       payload += `${id}${cleanValue.length.toString().padStart(2, "0")}${cleanValue}`;
    }
  }

  // Adiciona o CRC16 (ID 63)
  payload += '6304';
  payload += crc16(payload);

  return payload;
}

/**
 * Cálculo do CRC16 (CCITT-FALSE)
 */
function crc16(str: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    let b = str.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      let bit = ((b >> (7 - j) & 1) === 1);
      let c15 = ((crc >> 15 & 1) === 1);
      crc <<= 1;
      if (c15 !== bit) crc ^= polynomial;
    }
  }

  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export function getPixQRCodeUrl(payload: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
}
