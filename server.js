import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = process.env.PORT || 10000;

let requestHandler;

async function initializeServer() {
  try {
    console.log("[Server] Initializing React Router handler...");
    
    // Import the built server module
    const serverModule = await import(join(__dirname, "build", "server", "index.js"));
    
    // The server module exports a default handler
    requestHandler = serverModule.default;
    
    if (!requestHandler) {
      throw new Error("No default export found in server build");
    }
    
    console.log("[Server] ✅ React Router handler loaded successfully");
    return true;
  } catch (e) {
    console.error("[Server] ❌ Failed to initialize:", e.message);
    console.error(e.stack);
    return false;
  }
}

const server = createServer(async (req, res) => {
  try {
    // Initialize handler on first request
    if (!requestHandler) {
      const initialized = await initializeServer();
      if (!initialized) {
        res.writeHead(503, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Server initialization failed" }));
      }
    }

    // Call the React Router handler
    await requestHandler(req, res);
  } catch (error) {
    console.error("[Server] Error handling request:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`✅ ShareJoy server running on 0.0.0.0:${port}`);
});
