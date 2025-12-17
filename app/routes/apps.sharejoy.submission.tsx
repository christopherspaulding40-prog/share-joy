import { data } from 'react-router';
import type { Route } from './+types/apps.sharejoy.submission';
import prisma from '../db.server';

export const action = async ({ request }: Route.ActionArgs) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return data({}, { 
      status: 204, 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'POST,OPTIONS', 
        'Access-Control-Allow-Headers': 'Content-Type' 
      } 
    });
  }

  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { 
      status: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  }

  try {
    console.log('[apps.sharejoy.submission] Received request');
    
    const formData = await request.formData();
    const file = formData.get('file') as any;
    const productId = formData.get('productId')?.toString() || null;
    const customerEmail = formData.get('customerEmail')?.toString() || null;
    const customerName = formData.get('customerName')?.toString() || null;
    const productTitle = formData.get('productTitle')?.toString() || null;
    const orderNumber = formData.get('orderNumber')?.toString() || null;

    console.log('[apps.sharejoy.submission] Data:', { productId, customerEmail, orderNumber });

    if (!file || !productId) {
      return data({ 
        error: 'Missing required fields: file and productId are required' 
      }, { 
        status: 400, 
        headers: { 'Access-Control-Allow-Origin': '*' } 
      });
    }

    // Convert file to base64
    let imageData = '';
    try {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      imageData = `data:${file.type};base64,${base64}`;
    } catch (err) {
      console.error('[apps.sharejoy.submission] Error converting file:', err);
      return data({ 
        error: 'Error processing file upload' 
      }, { 
        status: 500, 
        headers: { 'Access-Control-Allow-Origin': '*' } 
      });
    }

    const submission = await (prisma as any).submission.create({
      data: {
        customerId: customerEmail || 'anonymous',
        customerName: customerName || 'Anonymous',
        customerEmail: customerEmail || 'noemail@example.com',
        productId: productId,
        productTitle: productTitle || 'Unknown Product',
        orderNumber: orderNumber || null,
        imageUrl: imageData,
        imageData: imageData,
        status: 'pending',
      },
    });

    console.log('[apps.sharejoy.submission] Created submission:', submission.id);

    return data({ 
      success: true, 
      submission: { id: submission.id, status: submission.status } 
    }, { 
      status: 200, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (error) {
    console.error('[apps.sharejoy.submission] Error:', error);
    const message = (error && (error as any).message) ? (error as any).message : 'Failed to upload submission';
    return data({ 
      error: message 
    }, { 
      status: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  }
};
