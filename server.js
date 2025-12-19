import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { createRequestHandler } from "@react-router/node";
import * as build from "./build/server/index.js";

const __dirname = import.meta.url.split("/").slice(0, -1).join("/").replace("file://", "");
const port = process.env.PORT || 10000;

// Create the request handler for React Router
const handler = createRequestHandler({ build });

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
      // File not found, continue to React Router
    }

    // Use React Router handler for all other requests
    const nodeRequest = {
      method: req.method,
      url: `http://${req.headers.host}${req.url}`,
      headers: req.headers,
      ...(req.method !== "GET" && req.method !== "HEAD" && { body: req })
    };

    const response = await handler(nodeRequest);
    
    // Set response headers
    for (const [name, value] of response.headers.entries()) {
      res.setHeader(name, value);
    }
    res.writeHead(response.status);

    // Stream the response
    if (response.body) {
      if (typeof response.body.pipe === "function") {
        response.body.pipe(res);
      } else {
        res.end(await response.text());
      }
    } else {
      res.end();
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
