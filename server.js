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
    requestHandler = createRequestListener({ build });
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

  // Wrap the request handler to catch async errors
  Promise.resolve()
    .then(() => requestHandler(req, res))
    .catch((error) => {
      console.error("[Server] Request handler error:", error.message);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
});

// Increase timeout values to prevent SIGTERM issues
server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;

server.listen(port, "0.0.0.0", () => {
  console.log(`✅ ShareJoy server running on 0.0.0.0:${port}`);
});
