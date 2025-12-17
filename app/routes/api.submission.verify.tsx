import type { ActionFunctionArgs } from "react-router";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import { sendVoucherEmail } from "../email.server";
import { createShopifyDiscountCode } from "../shopify-discount.server";

// Minimal json helper to avoid missing export in react-router SSR
const json = (body: any, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

export async function action({ request }: ActionFunctionArgs) {
  // Cast to any to avoid Prisma type drift in this template
  const prisma = db as any;
  const { admin } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const submissionId = formData.get("submissionId") as string;
  const action = formData.get("action") as string; // "approve" or "reject"
  
  if (!submissionId) {
    return json({ error: "Submission ID mangler" }, { status: 400 });
  }

  // Hent submission
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    return json({ error: "Submission findes ikke" }, { status: 404 });
  }

  if (action === "reject") {
    // Bare update status til rejected
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "rejected" },
    });
    
    return json({ success: true, message: "Submission afvist" });
  }

  if (action === "approve") {
    // Check if submission already has a voucher code
    if (!submission.voucherCode) {
      return json({ error: "Submission har ingen voucher code" }, { status: 400 });
    }

    // Get reward settings to determine voucher type
    const settings = await prisma.rewardSettings.findFirst();
    if (!settings) {
      return json({ error: "Reward settings ikke fundet" }, { status: 500 });
    }

    // Fetch order from Shopify if orderNumber exists
    let orderAmount = submission.orderAmount;
    if (!orderAmount && submission.orderNumber) {
      try {
        console.log("[Verify] Fetching order from Shopify:", submission.orderNumber);
        const orderQuery = `
          query getOrder($query: String!) {
            orders(first: 1, query: $query) {
              edges {
                node {
                  id
                  totalPriceSet {
                    shopMoney {
                      amount
                    }
                  }
                }
              }
            }
          }
        `;
        
        const orderResponse = await admin.graphql(orderQuery, {
          variables: { query: `name:${submission.orderNumber}` }
        });
        
        const orderResult = await orderResponse.json();
        const order = orderResult.data?.orders?.edges?.[0]?.node;
        
        if (order) {
          orderAmount = parseFloat(order.totalPriceSet.shopMoney.amount);
          console.log("[Verify] Order amount from Shopify:", orderAmount);
          
          // Update submission with order amount
          await prisma.submission.update({
            where: { id: submissionId },
            data: { orderAmount },
          });
        }
      } catch (error) {
        console.error("[Verify] Failed to fetch order from Shopify:", error);
      }
    }

    // Create Shopify discount code
    console.log("[Verify] Creating Shopify discount code:", submission.voucherCode);
    
    const discountResult = await createShopifyDiscountCode(admin, {
      code: submission.voucherCode,
      type: settings.voucherType || 'percentage_first_order',
      discountPercentage: settings.discountPercentage || 30,
      orderAmount: orderAmount, // Used for percentage_first_order
    });

    if (!discountResult.success) {
      console.error("[Verify] Discount creation failed:", discountResult.error);
      return json({ 
        error: "Kunne ikke oprette Shopify discount code",
        details: discountResult.error
      }, { status: 500 });
    }

    console.log("[Verify] Discount created:", discountResult.discountId);

    // Calculate discount amount for email display
    let discountAmount: number | undefined;
    if (settings.voucherType === 'percentage_first_order' && submission.orderAmount) {
      discountAmount = (submission.orderAmount * (settings.discountPercentage || 30)) / 100;
    }

    // Send email with existing voucher code
    console.log("[Verify] Sending voucher email for submission:", submissionId);
    
    const emailResult = await sendVoucherEmail(
      submission.customerEmail,
      submission.customerName || "Kunde",
      submission.voucherCode,
      submission.productTitle || "Produkt",
      settings.voucherType || 'percentage_first_order',
      settings.discountPercentage || 30,
      discountAmount
    );

    if (!emailResult.success) {
      console.error("[Verify] Email failed:", emailResult.error);
      return json({ 
        error: "Kunne ikke sende email - tjek konfiguration",
        details: String(emailResult.error)
      }, { status: 500 });
    }

    // Update submission status and mark email as sent
    await prisma.submission.update({
      where: { id: submissionId },
      data: { 
        status: "approved",
        emailSent: true,
        sentAt: new Date(),
      },
    });

    console.log("[Verify] Email sent successfully:", emailResult.messageId);
    return json({ 
      success: true, 
      message: `Voucher email sendt til ${submission.customerEmail}`,
      voucherCode: submission.voucherCode
    });
  }

  return json({ error: "Ugyldig action" }, { status: 400 });
}

