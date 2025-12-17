import { data } from 'react-router';
import type { Route } from './+types/api.rewards.upload';
import prisma from '../db.server';

export const action = async ({ request }: Route.ActionArgs) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return data({}, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }

  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    console.log('[api.rewards.upload] Request URL:', request.url);
    const contentType = request.headers.get('content-type') || '';
    console.log('[api.rewards.upload] Content-Type:', contentType);

    let productId: string | null = null;
    let customerName: string | null = null;
    let customerEmail: string | null = null;
    let productTitle: string | null = null;
    let imageData = '';

    // Handle JSON (from dashboard import)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      console.log('[api.rewards.upload] JSON body received');
      
      productId = body.productId || body.orderNumber || null;
      customerName = body.customerName || null;
      customerEmail = body.customerEmail || null;
      productTitle = body.productTitle || null;
      imageData = body.imageData || '';

      if (!imageData || !productId) {
        console.error('[api.rewards.upload] Missing imageData or productId in JSON');
        return data({ error: 'Missing required fields' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    } 
    // Handle FormData (from widget)
    else {
      const formData = await request.formData();
      const file = formData.get('file') as any;
      productId = formData.get('productId')?.toString() || null;
      customerName = formData.get('customerName')?.toString() || null;
      customerEmail = formData.get('customerEmail')?.toString() || null;
      productTitle = formData.get('productTitle')?.toString() || null;

      console.log('[api.rewards.upload] FormData received, productId:', productId);

      if (!file || !productId) {
        console.error('[api.rewards.upload] Missing file or productId');
        return data({ error: 'Missing required fields' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
      }

      // Convert file to base64
      try {
        const buffer = await file.arrayBuffer();
        console.log('[api.rewards.upload] File size:', buffer.byteLength, 'bytes');
        const base64 = Buffer.from(buffer).toString('base64');
        imageData = `data:${file.type};base64,${base64}`;
      } catch (err) {
        console.error('[api.rewards.upload] Error converting file', err);
        return data({ error: 'Error processing file' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    }

    const submission = await (prisma as any).submission.create({
      data: {
        customerId: customerEmail || 'anonymous',
        customerName: customerName || 'Anonymous',
        customerEmail: customerEmail || 'noemail@example.com',
        productId: productId,
        productTitle: productTitle || 'Unknown Product',
        imageUrl: imageData,
        imageData: imageData,
        status: 'pending',
      },
    });

    console.log('[api.rewards.upload] Created submission', submission.id);

    return data({ success: true, submission: { id: submission.id, status: submission.status } }, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    console.error('[api.rewards.upload] Error uploading submission:', error);
    const message = (error && (error as any).message) ? (error as any).message : 'Failed to upload submission';
    return data({ error: message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
};
