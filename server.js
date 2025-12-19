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
        const files = await readdir(path);
        console.log(`[Server] ✅ Found build directory at: ${path}`);
        console.log(`[Server] Contents:`, files.slice(0, 20));
        return path;
      }
    } catch (e) {
      console.log(`[Server] ❌ Checked: ${path}`);
    }
  }
  
  console.warn("[Server] ⚠️  No build directory found!");
  return null;
}

let buildDir = null;

// Generate HTML with React app entry point
async function generateHTML() {
  // Find the main entry file in assets
  if (!buildDir) return null;
  
  try {
    const files = await readdir(join(buildDir, "assets"));
    const entryFile = files.find(f => f.startsWith("entry.client") && f.endsWith(".js"));
    
    if (!entryFile) {
      console.warn("[Server] ⚠️  Could not find entry.client JS file");
      return null;
    }
    
    console.log(`[Server] Found entry file: ${entryFile}`);
    
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="preconnect" href="https://cdn.shopify.com/" />
    <link rel="stylesheet" href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css" />
    <title>ShareJoy</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${entryFile}"></script>
  </body>
</html>`;
  } catch (e) {
    console.error("[Server] Error generating HTML:", e.message);
    return null;
  }
}

const server = createServer(async (req, res) => {
  try {
    // Find build dir on first request
    if (!buildDir) {
      buildDir = await findBuildDir();
    }

    // Serve static assets with cache headers
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
          // Asset not found
        }
      }
    }

    // Serve generated HTML for all other requests (SPA routing)
    if (buildDir) {
      const html = await generateHTML();
      if (html) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        return;
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
          <p>Could not locate build artifacts. Build directory: ${buildDir || 'not found'}</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("[Server] Error:", error);
    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<html><body><h1>Server Error</h1><pre>${error.message}</pre></body></html>`);
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`✅ ShareJoy server running on 0.0.0.0:${port}`);
});
