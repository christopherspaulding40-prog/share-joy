import { data } from 'react-router';
import type { Route } from './+types/apps.sharejoy.api.rewards.upload';
import prisma from '../db.server';

import { generateVoucherCode } from '../voucher.server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle GET/OPTIONS so direct browser hits return a clear message instead of throwing
export const loader = async ({ request }: Route.LoaderArgs) => {
  if (request.method === 'OPTIONS') {
    return data(null, { status: 200, headers: corsHeaders });
  }

  return data(
    { error: 'Method not allowed. Use POST to submit via the app proxy.' },
    { status: 405, headers: corsHeaders },
  );
};

export const action = async ({ request }: Route.ActionArgs) => {
  console.log('[App Proxy] Received submission via app proxy');
  
  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return data(null, { status: 200, headers: corsHeaders });
  }
  
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as any;
    const productId = formData.get('productId')?.toString() || null;
    const customerName = formData.get('customerName')?.toString() || null;
    const customerEmail = formData.get('customerEmail')?.toString() || null;
    const productTitle = formData.get('productTitle')?.toString() || null;

    console.log('[App Proxy] Processing submission:', { productId, customerEmail, customerName, productTitle });

    if (!file) {
      console.error('[App Proxy] Missing file');
      return data({ error: 'File is required' }, { status: 400, headers: corsHeaders });
    }

    if (!productId) {
      console.warn('[App Proxy] Missing productId, using orderNumber or fallback');
    }

    // Convert file to base64
    let imageData = '';
    try {
      console.log('[App Proxy] Converting file to base64...');
      const buffer = await file.arrayBuffer();
      
      // Check file size - max 5MB
      if (buffer.byteLength > 5 * 1024 * 1024) {
        console.error('[App Proxy] File too large:', buffer.byteLength);
        return data({ error: 'File too large (max 5MB)' }, { status: 413, headers: corsHeaders });
      }
      
      const base64 = Buffer.from(buffer).toString('base64');
      imageData = `data:${file.type};base64,${base64}`;
      console.log('[App Proxy] File converted, size:', buffer.byteLength, 'bytes, base64 size:', imageData.length, 'chars');
    } catch (err) {
      console.error('[App Proxy] Error converting file', err);
      return data({ error: 'Error processing file' }, { status: 500, headers: corsHeaders });
    }

    try {
      console.log('[App Proxy] Creating submission in database...');
      const submission = await (prisma as any).submission.create({
        data: {
          shop: 'test-store.myshopify.com', // Tilføj required shop field
          customerId: customerEmail || 'anonymous',
          customerName: customerName || 'Anonymous',
          customerEmail: customerEmail || 'noemail@example.com',
          productId: productId || 'widget-submission',
          productTitle: productTitle || 'Unknown Product',
          imageUrl: imageData,
          imageData: imageData,
          status: 'pending',
          voucherCode: generateVoucherCode(),
        },
      });

      console.log('[App Proxy] Submission created:', submission.id, 'Voucher:', submission.voucherCode);
      
      return data({ 
        success: true, 
        submission: { 
          id: submission.id, 
          status: submission.status,
          voucherCode: submission.voucherCode
        } 
      }, { status: 200, headers: corsHeaders });
    } catch (dbError) {
      console.error('[App Proxy] Database error:', dbError);
      console.error('[App Proxy] Database error message:', (dbError as any)?.message);
      const message = (dbError && (dbError as any).message) ? (dbError as any).message : 'Database error';
      return data({ error: `Database: ${message}`, details: String(dbError) }, { status: 500, headers: corsHeaders });
    }
    
  } catch (error) {
    console.error('[App Proxy] Full error:', error);
    console.error('[App Proxy] Error stack:', (error as any)?.stack);
    const message = (error && (error as any).message) ? (error as any).message : 'Failed to create submission';
    return data({ error: message, details: String(error) }, { status: 500, headers: corsHeaders });
  }
};
