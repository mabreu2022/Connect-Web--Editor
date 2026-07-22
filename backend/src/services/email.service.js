const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER || process.env.GMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.GMAIL_PASS
  }
});

const FROM_EMAIL = process.env.MAILER_EMAIL || process.env.GMAIL_USER;

async function sendPasswordReset(email, nome, token) {
  await transporter.sendMail({
    from: `"Connect Web Editor" <${FROM_EMAIL}>`,
    to: email,
    subject: '🔑 Seu Código de Recuperação: ' + token + ' - Connect Web Editor',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #4f46e5; margin-top: 0;">Recuperação de Senha</h2>
        <p>Olá, <strong>${nome}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir sua senha no <strong>Connect Web Editor</strong>.</p>
        
        <p style="margin-top: 20px; margin-bottom: 8px; font-weight: 600; color: #334155;">Seu código de verificação é:</p>
        <div style="background: #e0e7ff; color: #3730a3; font-size: 36px; font-weight: 800; letter-spacing: 8px; text-align: center; padding: 18px; border-radius: 12px; margin: 12px 0 20px; border: 1px dashed #6366f1;">
          ${token}
        </div>

        <p style="color: #64748b; font-size: 13px;">Insira este código no aplicativo para redefinir sua senha. O código é válido por <strong>1 hora</strong>.</p>
        <p style="color: #94a3b8; font-size: 12px;">Se você não solicitou isso, pode ignorar este e-mail em segurança.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
        <p style="color:#94a3b8;font-size:12px;text-align:center;">© ${new Date().getFullYear()} Connect Web Editor</p>
      </div>
    `
  });
}

async function sendWelcome(email, nome) {
  await transporter.sendMail({
    from: `"Connect Web Editor" <${FROM_EMAIL}>`,
    to: email,
    subject: '🚀 Bem-vindo ao Connect Web Editor!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <h2 style="color: #4f46e5;">Bem-vindo, ${nome}! 🎉</h2>
        <p>Sua conta foi criada com sucesso no plano <strong>Gratuito</strong>.</p>
        <p>Você já pode começar a criar websites incríveis!</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Acessar o Editor
        </a>
        <p style="color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} Connect Web Editor</p>
      </div>
    `
  });
}

module.exports = { sendPasswordReset, sendWelcome };
