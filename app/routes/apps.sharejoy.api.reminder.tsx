import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /apps/sharejoy/api/reminder
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const data = await request.json();
    const email = data.email;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return json({ error: "Ugyldig email" }, { status: 400 });
    }
    // Beregn tidspunkt 3 dage fra nu
    const sendAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await prisma.reminderEmail.create({
      data: {
        email,
        sendAt,
      },
    });
    return json({ success: true });
  } catch (e) {
    return json({ error: "Serverfejl" }, { status: 500 });
  }
};

export const loader = async () => {
  return json({ error: "Not found" }, { status: 404 });
};
