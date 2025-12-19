import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const port = process.env.PORT || 10000;

const server = createServer(async (req, res) => {
  try {
    // Serve static client assets with cache headers
    if (req.url && /\.(js|css|woff|woff2|ttf|eot|map|png|jpg|jpeg|gif|svg|ico)(\?|$)/.test(req.url)) {
      try {
        const filePath = join(__dirname, "build/client", req.url.split("?")[0]);
        const content = await readFile(filePath);
        const contentType = req.url.includes(".js") ? "application/javascript"
          : req.url.includes(".css") ? "text/css"
          : req.url.includes(".woff") ? "font/woff"
          : req.url.includes(".woff2") ? "font/woff2"
          : req.url.includes(".ttf") ? "font/ttf"
          : req.url.includes(".svg") ? "image/svg+xml"
          : req.url.includes(".map") ? "application/json"
          : "application/octet-stream";
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable"
        });
        res.end(content);
        return;
      } catch (e) {
        // Asset not found, continue
      }
    }

    // Try to serve static files from build/client
    try {
      const filePath = join(__dirname, "build/client", req.url === "/" ? "index.html" : req.url.split("?")[0]);
      const stats = await stat(filePath);
      if (stats.isFile()) {
        const content = await readFile(filePath);
        const contentType = filePath.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
        return;
      }
    } catch (e) {
      // File not found, serve index.html for SPA routing
    }

    // Serve index.html for all other requests (SPA routing)
    try {
      const indexPath = join(__dirname, "build/client", "index.html");
      console.log("[Server] Serving index.html from:", indexPath);
      const content = await readFile(indexPath);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(content);
    } catch (error) {
      console.error("[Server] Could not load index.html from", join(__dirname, "build/client", "index.html"), ":", error.message);
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Error</title>
          </head>
          <body>
            <h1>Server Error</h1>
            <p>Could not load application. Check server logs.</p>
            <p style="font-size: 0.9em; color: #666;">Build directory may not exist.</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error("[Server] Error:", error);
    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Error</title>
        </head>
        <body>
          <h1>Server Error</h1>
          <pre>${error.message}</pre>
        </body>
      </html>
    `);
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`✅ ShareJoy server running on 0.0.0.0:${port}`);
});
