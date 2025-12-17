import type { LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get shop from query params
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";

  // Injekt widget script på thank you siden
  const script = `
(function() {
  // Vent på at siden loader
  document.addEventListener('DOMContentLoaded', function() {
    // Tjek om vi er på order/thank you siden
    if (document.body.classList.contains('template-customers-order') || 
        window.location.pathname.includes('/orders/') ||
        document.querySelector('[data-order-number]')) {
      
      // Hent ordrenummer fra siden
      let orderNumber = '';
      
      // Prøv forskellige måder at finde ordrenummeret
      const orderElement = document.querySelector('[data-order-number]');
      if (orderElement) {
        orderNumber = orderElement.getAttribute('data-order-number');
      }
      
      if (!orderNumber) {
        const heading = document.querySelector('h1');
        if (heading) {
          const match = heading.textContent.match(/#(\\d+)/);
          if (match) orderNumber = match[1];
        }
      }

      if (!orderNumber) {
        const text = document.body.innerText;
        const match = text.match(/#(\\d+)/);
        if (match) orderNumber = match[1];
      }

      if (orderNumber) {
        // Opret ShareJoy widget
        const widget = document.createElement('div');
        widget.id = 'sharejoy-widget';
        widget.style.cssText = \`
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 24px;
          margin: 20px 0;
          color: white;
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        \`;
        
        widget.innerHTML = \`
          <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 12px 0;">🎁 Del & Få Rabat</h2>
          <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px 0; opacity: 0.95;">
            Tak for dit køb! Upload dit screenshot fra sociale medier sammen med dit ordrenummer, 
            så sender vi dig en voucher eller cashback når det er godkendt.
          </p>
          <a href="/apps/sharejoy/upload?order=\${encodeURIComponent(orderNumber)}&shop=\${encodeURIComponent('${shop}')}" 
             style="display: inline-block; background: white; color: #667eea; padding: 12px 24px; 
                    border-radius: 8px; font-weight: 600; text-decoration: none; 
                    transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;"
             onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)';"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
            Upload dit screenshot
          </a>
        \`;

        // Indsæt widget på siden
        const mainContent = document.querySelector('main') || 
                           document.querySelector('[role="main"]') ||
                           document.querySelector('.section');
        
        if (mainContent) {
          mainContent.insertBefore(widget, mainContent.firstChild);
        } else {
          document.body.insertBefore(widget, document.body.firstChild);
        }
      }
    }
  });
})();
  `;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
    },
  });
};
