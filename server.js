import { createServer } from "http";

const port = process.env.PORT || 10000;

// For Shopify embedded apps deployed to Node, we need to:
// 1. Import the built server module
// 2. Let it handle SSR + API routes
// 3. Proxy requests through it

let requestHandler;

// Load the request handler from the build
try {
  // Dynamically import the build to handle Shopify initialization
  const buildModule = await import("./build/server/index.js");
  
  // The build module contains everything we need
  // We'll use it as a handler if it's a function, otherwise create a wrapper
  if (typeof buildModule.default === "function") {
    requestHandler = buildModule.default;
  } else {
    // Fallback: create a simple handler
    requestHandler = async (req) => {
      return new Response("Service running", { status: 200 });
    };
  }
} catch (error) {
  console.error("Failed to load build module:", error);
  requestHandler = async (req) => {
    return new Response("Error loading app", { status: 500 });
  };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    
    // Collect body
    let body = null;
    if (!["GET", "HEAD"].includes(req.method)) {
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", chunk => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: body || undefined,
      duplex: "half",
    });

    const response = await requestHandler(request);

    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) {
      res.end(Buffer.from(await response.arrayBuffer()));
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Server error:", error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server listening on 0.0.0.0:${port}`);
});
