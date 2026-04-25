import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true" || false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendWelcomeEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: `"PedeUe" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Bem-vindo a PedeUe - Sua nova loja digital!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px; border-radius: 16px; text-align: center;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://pedeue.com'}/logo.png" alt="PedeUe" style="height: 60px; margin-bottom: 24px;" />
        <h1 style="color: #0f172a; margin-bottom: 16px; font-size: 24px;">Olá, ${name}! Bem-vindo ao PedeUe!</h1>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Estamos muito felizes em ter você conosco. Sua conta foi criada com sucesso e você já pode começar a aproveitar seus 3 dias grátis para transformar o seu negócio.
        </p>
        <div style="background-color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <h2 style="color: #8b5cf6; font-size: 18px; margin-bottom: 12px;">Próximos Passos</h2>
          <ul style="text-align: left; color: #475569; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Acesse seu painel administrativo</li>
            <li style="margin-bottom: 8px;">Cadastre seus primeiros produtos ou serviços</li>
            <li style="margin-bottom: 8px;">Compartilhe seu link exclusivo com seus clientes</li>
          </ul>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/entrar" style="display: inline-block; background-color: #8b5cf6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          ACESSAR MEU PAINEL
        </a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
          © ${new Date().getFullYear()} PedeUe. Todos os direitos reservados.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Erro ao enviar email de boas vindas:", error);
  }
};

export const sendRecoveryEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/recuperar-senha?token=${token}`;
  
  const mailOptions = {
    from: `"PedeUe Suporte" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Recuperação de Senha - PedeUe",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px; border-radius: 16px; text-align: center;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://pedeue.com'}/logo.png" alt="PedeUe" style="height: 60px; margin-bottom: 24px;" />
        <h1 style="color: #0f172a; margin-bottom: 16px; font-size: 24px;">Recuperação de Senha</h1>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Recebemos uma solicitação para redefinir a senha da sua conta no PedeUe. Se foi você, clique no botão abaixo para criar uma nova senha.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #8b5cf6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          REDEFINIR MINHA SENHA
        </a>
        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
          Se você não solicitou a alteração, pode ignorar este email com segurança. O link expira em 1 hora.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
          © ${new Date().getFullYear()} PedeUe. Todos os direitos reservados.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Erro ao enviar email de recuperação:", error);
  }
};
