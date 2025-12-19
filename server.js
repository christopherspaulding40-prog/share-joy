import { createServer } from "http";
import { readFile } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = import.meta.url.split("/").slice(0, -1).join("/").replace("file://", "");
const port = process.env.PORT || 10000;

const server = createServer(async (req, res) => {
  try {
    // Serve static client assets
    if (req.url && (req.url.includes(".js") || req.url.includes(".css") || req.url.includes(".woff"))) {
      const filePath = join(__dirname, "build/client", req.url.split("?")[0]);
      const content = await readFile(filePath);
      const contentType = req.url.includes(".js") ? "application/javascript" 
                        : req.url.includes(".css") ? "text/css"
                        : "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
      return;
    }

    // Default: serve info page
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>ShareJoy - Shopify App</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 100px auto; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
            h1 { color: #a855f7; margin-bottom: 1rem; }
            p { color: #666; line-height: 1.6; margin: 1rem 0; }
            .highlight { background: #f0f0f0; padding: 1rem; border-radius: 4px; margin: 1.5rem 0; font-family: monospace; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎁 ShareJoy Admin Dashboard</h1>
            <p><strong>This is a Shopify embedded app.</strong></p>
            <p>To access the dashboard, you need to:</p>
            <ol style="text-align: left; padding-left: 2rem;">
              <li>Go to your Shopify Admin</li>
              <li>Navigate to Apps → ShareJoy</li>
              <li>The dashboard will load inside Shopify Admin</li>
            </ol>
            <p style="margin-top: 2rem; color: #999; font-size: 0.9rem;">
              This URL is used for API endpoints and Shopify redirects.<br>
              Direct access is not supported for security reasons.
            </p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Request error:", error);
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`<html><body><h1>Server Error</h1><p>${error.message}</p></body></html>`);
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`✅ ShareJoy server running on 0.0.0.0:${port}`);
});
