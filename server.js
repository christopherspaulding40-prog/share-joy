import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 10000;

// Import the React Router handler
let requestHandler;

async function initHandler() {
  try {
    const build = await import("./build/server/index.js");
    requestHandler = build.default || build.handler;
    console.log("✅ React Router handler loaded");
  } catch (e) {
    console.error("❌ Failed to load React Router handler:", e.message);
    // Fallback handler
    requestHandler = (req, res) => {
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head><title>Error</title></head>
          <body><h1>Server Error</h1><p>Failed to load React Router handler</p></body>
        </html>
      `);
    };
  }
}

// Initialize handler before starting server
await initHandler();

const server = createServer(async (req, res) => {
  try {
    // Use the React Router handler
    if (requestHandler) {
      await requestHandler(req, res);
    } else {
      res.writeHead(503, { "Content-Type": "text/html" });
      res.end("Service initializing...");
    }
  } catch (error) {
    console.error("Request error:", error);
    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ShareJoy - Error</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            #root { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }
            .container { background: white; padding: 2rem; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            h1 { color: #333; margin-bottom: 1rem; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div id="root">
            <div class="container">
              <h1>❌ Server Error</h1>
              <p>${error.message}</p>
            </div>
          </div>
        </body>
      </html>
    `);
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`✅ ShareJoy server running on 0.0.0.0:${port}`);
});
