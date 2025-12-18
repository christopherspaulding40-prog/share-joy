import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReminderEmails() {
  try {
    // Find alle reminders der skal sendes nu
    const now = new Date();
    const reminders = await prisma.reminderEmail.findMany({
      where: {
        sent: false,
        sendAt: { lte: now },
      },
    });

    console.log(`[Reminders] Finder reminders at sende... Fundet ${reminders.length} stk`);

    // Hent reward settings for email-template
    const settings = await prisma.rewardSettings.findFirst();

    for (const reminder of reminders) {
      try {
        const subject = settings?.reminderEmailSubject || "⏰ Din reminder fra ShareJoy";
        const fromName = settings?.reminderEmailFromName || "ShareJoy";
        const bodyHTML = settings?.reminderEmailBodyHTML || "<p>Hej! Dette er din reminder fra ShareJoy.<br>Du ønskede at blive mindet om at lægge en ordre. God fornøjelse!</p>";
        const brandColor = settings?.reminderEmailBrandColor || "#6366f1";

        const result = await resend.emails.send({
          from: `${fromName} <onboarding@resend.dev>`,
          to: reminder.email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, ${brandColor} 0%, #ec4899 100%); padding: 40px; text-align: center; border-radius: 8px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Din Reminder!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Det er tid til at handle</p>
              </div>
              
              <div style="padding: 40px; background: #f9fafb;">
                ${bodyHTML}
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://www.example.com" style="background: ${brandColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Shop nu</a>
                </div>
              </div>
              
              <div style="padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                <p>Du modtog denne email fordi du ønskede en reminder fra ShareJoy</p>
              </div>
            </div>
          `,
        });

        if (result.error) {
          console.error(`[Reminders] Fejl ved afsendelse til ${reminder.email}:`, result.error);
        } else {
          await prisma.reminderEmail.update({
            where: { id: reminder.id },
            data: { sent: true },
          });
          console.log(`[Reminders] ✅ Reminder sendt til ${reminder.email}`);
        }
      } catch (err) {
        console.error(`[Reminders] Fejl ved afsendelse til ${reminder.email}:`, err);
      }
    }

    console.log(`[Reminders] Job færdig`);
  } catch (error) {
    console.error("[Reminders] Kritisk fejl:", error);
  }
}

// ESM entrypoint check
if (import.meta.url === `file://${process.argv[1]}`) {
  sendReminderEmails().then(() => {
    console.log('Reminder-job færdig');
    process.exit(0);
  });
}
