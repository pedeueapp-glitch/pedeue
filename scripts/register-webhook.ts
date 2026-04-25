import efi from '../src/lib/efi';

async function register() {
  const pixKey = process.env.EFI_PIX_KEY;
  const appUrl = process.env.NEXTAUTH_URL; // Ex: https://pedeue.com
  const webhookUrl = `${appUrl}/api/webhooks/efi`;

  if (!pixKey || !appUrl) {
    console.error("ERRO: EFI_PIX_KEY ou NEXTAUTH_URL não configurados no .env");
    process.exit(1);
  }

  console.log(`Configurando Webhook na Efí...`);
  console.log(`Chave Pix: ${pixKey}`);
  console.log(`URL do Webhook: ${webhookUrl}`);

  try {
    const params = {
      chave: pixKey
    };

    const body = {
      webhookUrl: webhookUrl
    };

    const response = await efi.pixConfigWebhook(params, body);
    console.log("SUCESSO! Webhook configurado corretamente.");
    console.log("Resposta da Efí:", response);
  } catch (error: any) {
    console.error("ERRO AO CONFIGURAR WEBHOOK:", error);
    if (error.error_description) console.error("Detalhes:", error.error_description);
  }
}

register();
