import type { ActionFunctionArgs } from 'react-router';
import prisma from '../db.server';

// Minimal json helper to avoid missing export in react-router SSR
const json = (body: any, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let shop, orderNumber, customerEmail, customerName, imageUrl, imageData, productId, productTitle;

    if (contentType.includes('application/json')) {
      // Handle JSON request from widget
      const body = await request.json();
      shop = body.shop || 'widget-shop.myshopify.com';
      orderNumber = body.orderNumber;
      customerEmail = body.email;
      customerName = body.customerName || 'Widget Customer';
      imageUrl = 'widget-upload';
      imageData = body.imageData;
      productId = body.productId || 'widget-product';
      productTitle = body.productTitle || 'Product Page Share';
    } else {
      // Handle FormData request
      const formData = await request.formData();
      shop = formData.get('shop') as string;
      orderNumber = formData.get('orderNumber') as string;
      customerEmail = formData.get('customerEmail') as string;
      customerName = formData.get('customerName') as string;
      imageUrl = formData.get('imageUrl') as string;
      imageData = formData.get('imageData') as string;
      productId = 'unknown';
      productTitle = 'Product';
    }

    if (!orderNumber || !customerEmail || !imageData) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const submission = await (prisma as any).submission.create({
      data: {
        shop,
        customerId: 'widget-customer',
        customerName: customerName || 'Unknown',
        customerEmail,
        orderNumber,
        productId: productId || 'unknown',
        productTitle: productTitle || 'Product',
        imageUrl: imageUrl || 'widget-upload',
        imageData,
        status: 'pending',
      },
    });

    return json({ success: true, submission });
  } catch (error) {
    console.error('Error creating submission:', error);
    return json({ error: 'Failed to create submission' }, { status: 500 });
  }
};
