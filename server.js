import { createServer } from "http";
import { createReadStream } from "fs";
import { resolve, extname } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const clientDir = resolve(__dirname, "build/client");

const port = process.env.PORT || 10000;

// Simple static file serving
const serveStatic = (filePath) => {
  const ext = extname(filePath);
  const contentTypeMap = {
    ".js": "application/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  };
  
  const contentType = contentTypeMap[ext] || "application/octet-stream";
  const stream = createReadStream(filePath);
  
  return { stream, contentType };
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    // Try static files first
    if (pathname !== "/" && !pathname.includes("?")) {
      const filePath = resolve(clientDir, pathname.slice(1));
      
      if (existsSync(filePath) && filePath.startsWith(clientDir)) {
        const { stream, contentType } = serveStatic(filePath);
        res.setHeader("Content-Type", contentType);
        stream.pipe(res);
        return;
      }
    }

    // Serve index.html for all other routes (SPA)
    const indexPath = resolve(clientDir, "index.html");
    if (existsSync(indexPath)) {
      const { stream, contentType } = serveStatic(indexPath);
      res.setHeader("Content-Type", contentType);
      stream.pipe(res);
    } else {
      res.statusCode = 404;
      res.end("Not found");
    }
  } catch (error) {
    console.error("Server error:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server listening on 0.0.0.0:${port}`);
});
