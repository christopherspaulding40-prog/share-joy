import type { ActionFunctionArgs } from 'react-router';
import prisma from '../db.server';

// Public endpoint accessible from storefront
export const action = async ({ request }: ActionFunctionArgs) => {
  // Set CORS headers to allow requests from Shopify storefront
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[proxy.submission] Request received from:', request.headers.get('origin'));
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId')?.toString() || 'unknown';
    const productTitle = formData.get('productTitle')?.toString() || 'Product';
    const customerEmail = formData.get('customerEmail')?.toString();
    const customerName = formData.get('customerName')?.toString() || 'Widget Customer';

    if (!file || !customerEmail) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = `data:${file.type};base64,${Buffer.from(buffer).toString('base64')}`;

    console.log('[proxy.submission] Creating submission for:', customerEmail);

    // Create submission in database
    const submission = await (prisma as any).submission.create({
      data: {
        shop: 'widget-submission',
        customerId: 'widget-customer',
        customerName,
        customerEmail,
        orderNumber: customerName.includes('Order') ? customerName.split('Order ')[1] : 'N/A',
        productId,
        productTitle,
        imageUrl: 'widget-upload',
        imageData: base64,
        status: 'pending',
      },
    });

    console.log('[proxy.submission] Submission created:', submission.id);

    return new Response(JSON.stringify({ success: true, id: submission.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[proxy.submission] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create submission' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
