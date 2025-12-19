import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = process.env.PORT || 10000;

// Read the HTML template
const htmlPath = join(__dirname, "build", "client", "index.html");
let htmlTemplate = "";

try {
  if (existsSync(htmlPath)) {
    htmlTemplate = readFileSync(htmlPath, "utf-8");
    console.log("[Server] ✅ Loaded index.html from build/client/");
  } else {
    console.log("[Server] ⚠️  index.html not found, will serve empty HTML");
    htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShareJoy</title>
  <link rel="preconnect" href="https://cdn.shopify.com/">
  <link rel="stylesheet" href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/@vite/client"></script>
  <script type="module" src="/src/entry.client.tsx"></script>
</body>
</html>`;
  }
} catch (e) {
  console.error("[Server] Error reading index.html:", e.message);
}

const server = createServer((req, res) => {
  try {
    // Parse the URL
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    let filePath = join(__dirname, "build", "client", url.pathname);

    // Security: prevent directory traversal
    if (!filePath.startsWith(join(__dirname, "build", "client"))) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    // Try to serve the file
    if (existsSync(filePath)) {
      // Get the file extension
      const ext = path.extname(filePath);
      const mimeTypes = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
      };

      const contentType = mimeTypes[ext] || "application/octet-stream";
      const file = readFileSync(filePath);

      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": file.length,
      });
      res.end(file);
    } else {
      // For SPA: serve index.html for non-file routes so React Router can handle them
      res.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(htmlTemplate),
      });
      res.end(htmlTemplate);
    }
  } catch (error) {
    console.error("[Server] Error handling request:", error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`✅ ShareJoy server running on 0.0.0.0:${port}`);
  console.log(`📍 Visit: https://share-joy.onrender.com`);
});
