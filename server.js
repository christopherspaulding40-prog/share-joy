import { createServer } from "http";
import { readFile, stat, readdir } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const port = process.env.PORT || 10000;

// Find the correct build directory
async function findBuildDir() {
  const possiblePaths = [
    join(__dirname, "build", "client"),
    join(__dirname, "dist"),
    join(__dirname, "..", "build", "client"),
    "/opt/render/project/src/build/client",
    "/opt/render/project/build/client",
  ];
  
  console.log("[Server] Looking for build directory...");
  
  for (const path of possiblePaths) {
    try {
      const stats = await stat(path);
      if (stats.isDirectory()) {
        // List what's in the directory
        const files = await readdir(path);
        console.log(`[Server] ✅ Found build directory at: ${path}`);
        console.log(`[Server] Contents:`, files.slice(0, 20));
        
        // Check if index.html exists
        if (files.includes("index.html")) {
          console.log(`[Server] ✅ index.html found!`);
          return path;
        } else {
          console.log(`[Server] ⚠️  index.html NOT found in this directory`);
        }
      }
    } catch (e) {
      console.log(`[Server] ❌ Checked: ${path}`);
    }
  }
  
  console.warn("[Server] ⚠️  No build directory with index.html found!");
  return null;
}

let buildDir = null;

const server = createServer(async (req, res) => {
  try {
    // Find build dir on first request
    if (!buildDir) {
      buildDir = await findBuildDir();
    }

    // Serve static client assets with cache headers
    if (req.url && /\.(js|css|woff|woff2|ttf|eot|map|png|jpg|jpeg|gif|svg|ico)(\?|$)/.test(req.url)) {
      if (buildDir) {
        try {
          const filePath = join(buildDir, req.url.split("?")[0]);
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
    }

    // Try to serve static files from build directory
    if (buildDir) {
      try {
        const filePath = join(buildDir, req.url === "/" ? "index.html" : req.url.split("?")[0]);
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
    }

    // Serve index.html for all other requests (SPA routing)
    if (buildDir) {
      try {
        const indexPath = join(buildDir, "index.html");
        const content = await readFile(indexPath);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(content);
        return;
      } catch (error) {
        console.error("[Server] Could not load index.html from", buildDir, ":", error.message);
      }
    }

    // Fallback error page
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
          <p>Build directory not found. Expected build artifacts at one of:</p>
          <ul>
            <li>${join(__dirname, "build/client")}</li>
            <li>${join(__dirname, "dist")}</li>
            <li>/opt/render/project/src/build/client</li>
          </ul>
          <p>Make sure the build completed successfully.</p>
        </body>
      </html>
    `);
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
