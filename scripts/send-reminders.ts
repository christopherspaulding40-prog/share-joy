import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Konfigurer din SMTP transport her
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "user@example.com",
    pass: process.env.SMTP_PASS || "password",
  },
});

export async function sendReminderEmails() {
  // Find alle reminders der skal sendes nu
  const now = new Date();
  const reminders = await prisma.reminderEmail.findMany({
    where: {
      sent: false,
      sendAt: { lte: now },
    },
  });

  for (const reminder of reminders) {
    try {
      await transporter.sendMail({
        from: process.env.REMINDER_FROM || 'noreply@sharejoy.dk',
        to: reminder.email,
        subject: 'Din påmindelse fra ShareJoy',
        text: 'Hej! Dette er din reminder fra ShareJoy. Du ønskede at blive mindet om at lægge en ordre. God fornøjelse!',
        html: '<p>Hej! Dette er din reminder fra ShareJoy.<br>Du ønskede at blive mindet om at lægge en ordre. God fornøjelse!</p>',
      });
      await prisma.reminderEmail.update({
        where: { id: reminder.id },
        data: { sent: true },
      });
      console.log(`Reminder sendt til ${reminder.email}`);
    } catch (err) {
      console.error(`Fejl ved afsendelse til ${reminder.email}:`, err);
    }
  }
}

// ESM entrypoint check
if (import.meta.url === `file://${process.argv[1]}`) {
  sendReminderEmails().then(() => {
    console.log('Reminder-job færdig');
    process.exit(0);
  });
}
