// Email service - setup credentials i .env senere
// Du skal tilføje: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  // TODO: Setup nodemailer når du har email credentials
  console.log('📧 Email ville blive sendt:', {
    to: options.to,
    subject: options.subject,
  });

  // Placeholder - returner success
  return { success: true, messageId: 'placeholder' };
}

export function generateVoucherEmail(customerName: string, voucherCode: string, amount: number) {
  const amountDKK = Math.round(amount / 100);
  
  return {
    subject: '🎁 Din rabatkode fra ShareJoy!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">🎁 Tak for dit bidrag!</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px;">Hej ${customerName},</p>
          <p style="font-size: 16px;">Tak fordi du delte dit produkt på sociale medier!</p>
          <p style="font-size: 16px;">Her er din rabatkode:</p>
          <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 2px;">${voucherCode}</div>
            <div style="margin-top: 10px; color: #666;">Værdi: ${amountDKK} DKK</div>
          </div>
          <p style="font-size: 14px; color: #666;">Brug koden ved dit næste køb!</p>
        </div>
      </div>
    `
  };
}

export function generateCashbackEmail(customerName: string, amount: number) {
  const amountDKK = Math.round(amount / 100);
  
  return {
    subject: '💰 Din cashback er på vej!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">💰 Cashback Godkendt!</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px;">Hej ${customerName},</p>
          <p style="font-size: 16px;">Din cashback er blevet godkendt!</p>
          <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <div style="font-size: 48px; font-weight: bold; color: #34c759;">${amountDKK} DKK</div>
            <div style="margin-top: 10px; color: #666;">refunderet til din oprindelige betalingsmetode</div>
          </div>
          <p style="font-size: 14px; color: #666;">Pengene vil være på din konto inden for 5-7 hverdage.</p>
        </div>
      </div>
    `
  };
}
