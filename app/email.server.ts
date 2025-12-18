import { Resend } from 'resend';
import db from './db.server';

const resend = new Resend(process.env.RESEND_API_KEY);

interface VoucherEmailParams {
  customerEmail: string;
  customerName: string;
  voucherCode: string;
  productTitle: string;
  voucherType?: 'percentage_first_order' | 'percentage_next_order';
  discountPercentage?: number;
  discountAmount?: number; // For percentage_first_order
}

export async function sendVoucherEmail(
  customerEmail: string,
  customerName: string,
  voucherCode: string,
  productTitle: string,
  voucherType: 'percentage_first_order' | 'percentage_next_order' = 'percentage_first_order',
  discountPercentage: number = 30,
  discountAmount?: number
) {
  try {
    console.log('[Email] Attempting to send voucher email to:', customerEmail);
    console.log('[Email] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      console.error('[Email] ERROR: RESEND_API_KEY not set in environment');
      return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    const prisma = db as any;
    const settings = await prisma.rewardSettings.findFirst();
    const subject = settings?.emailSubject || '🎁 Din rabat er klar!';
    const fromName = settings?.emailFromName || 'ShareJoy';
    const brand = settings?.emailBrandColor || '#a855f7';
    const buttonText = settings?.emailButtonText || 'Shop nu';
    const customBody = settings?.emailBodyHTML || '<p>Tak for dit bidrag! Din rabat er klar.</p>';

    console.log('[Email] Sending from:', `${fromName} <onboarding@resend.dev>`);

    console.log('[Email] About to send email with:', {
      from: `${fromName} <onboarding@resend.dev>`,
      to: customerEmail,
      subject: subject,
      hasHtml: true,
    });

    // For testing: send all emails to Resend's test recipient
    const testMode = true;
    const recipientEmail = testMode ? 'delivered@resend.dev' : customerEmail;
    
    console.log('[Email] Sending to:', recipientEmail, testMode ? '(TEST MODE)' : '');

    const result = await resend.emails.send({
      from: `${fromName} <onboarding@resend.dev>`,
      to: recipientEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${brand} 0%, #ec4899 100%); padding: 40px; text-align: center; border-radius: 8px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎁 Tak for dit bidrag!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Din rabat er nu aktiveret</p>
          </div>
          
          <div style="padding: 40px; background: #f9fafb;">
            <p style="font-size: 16px; color: #1f2937; margin-bottom: 24px;">
              Hej ${customerName || 'ven'},
            </p>
            
            ${customBody}
            
            <div style="background: white; padding: 24px; border: 2px solid ${brand}; border-radius: 8px; text-align: center; margin: 32px 0;">
              <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">
                ${voucherType === 'percentage_next_order' 
                  ? `${discountPercentage}% rabat på din næste ordre` 
                  : `${discountAmount ? Math.round(discountAmount) : ''} DKK voucher`}
              </p>
              <p style="font-size: 28px; font-weight: bold; color: #a855f7; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                ${voucherCode}
              </p>
              <p style="font-size: 12px; color: #6b7280; margin: 12px 0 0 0;">
                Kopier og indsæt når du handler
              </p>
            </div>
            
            <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin: 24px 0;">
              <strong>Sådan bruger du din rabat:</strong>
            </p>
            <ol style="font-size: 15px; color: #4b5563; line-height: 1.8;">
              <li>Gå tilbage til vores butik</li>
              <li>Tilføj dine ønskede produkter til kurven</li>
              <li>Ved kassen: Indsæt rabatkoden og få din rabat</li>
            </ol>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              Har du spørgsmål? Kontakt os på <strong>support@share-joy.dk</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">${fromName} © 2025 - Del & få rabat</p>
            <a href="/" style="display:inline-block;margin-top:8px;background:${brand};color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">${buttonText}</a>
          </div>
        </div>
      `,
    });

    console.log('[Email] Full response from Resend:', JSON.stringify(result, null, 2));
    console.log('[Email] Has error?', result.error);
    console.log('[Email] Has data?', result.data);
    if (result.error) {
      console.log('[Email] ERROR from Resend API:', result.error);
      return { success: false, error: result.error };
    }
    console.log('[Email] ✓ Email sent successfully:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error('[Email] ERROR sending voucher email:', error.message);
    console.error('[Email] Full error:', error);
    return { success: false, error: error.message || String(error) };
  }
}
