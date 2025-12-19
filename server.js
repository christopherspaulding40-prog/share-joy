import { createRequestListener } from "@react-router/node";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = process.env.PORT || 10000;

let requestHandler;

async function initializeServer() {
  try {
    const build = await import(join(__dirname, "build", "server", "index.js"));
    
    // Create request listener with error handling wrapper
    const baseHandler = createRequestListener({ build });
    
    // Wrap handler to catch errors and prevent crashes
    requestHandler = (req, res) => {
      try {
        baseHandler(req, res);
      } catch (error) {
        console.error("[Server] Handler error:", error.message);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      }
    };
    
    console.log("[Server] ✅ React Router handler initialized");
    return true;
  } catch (e) {
    console.error("[Server] Failed to initialize:", e.message);
    return false;
  }
}

const server = createServer(async (req, res) => {
  // Initialize on first request
  if (!requestHandler) {
    const initialized = await initializeServer();
    if (!initialized) {
      res.writeHead(503);
      return res.end("Service unavailable");
    }
  }

  requestHandler(req, res);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`✅ ShareJoy server running on 0.0.0.0:${port}`);
});
