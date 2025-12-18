import type { ActionFunctionArgs } from "react-router";
import db from "../db.server";

// Minimal json helper
const json = (body: any, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

// POST /apps/sharejoy/api/reminder
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const prisma = db as any;
    const data = await request.json();
    const email = data.email as string;

    // Validér email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      console.log("[Reminder] Ugyldig email:", email);
      return json({ error: "Ugyldig email" }, { status: 400 });
    }

    // Beregn tidspunkt 3 dage fra nu
    const sendAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    console.log("[Reminder] Opretter reminder for", email, "scheduled for", sendAt);

    const reminder = await prisma.reminderEmail.create({
      data: {
        email,
        sendAt,
      },
    });

    console.log("[Reminder] ✅ Reminder oprettet:", reminder.id);
    return json({ success: true, id: reminder.id });
  } catch (e: any) {
    console.error("[Reminder] Serverfejl:", e.message);
    return json({ error: "Serverfejl" }, { status: 500 });
  }
}

export async function loader() {
  return json({ error: "Not found" }, { status: 404 });
}
