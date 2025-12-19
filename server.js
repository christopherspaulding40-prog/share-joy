import { createRequestHandler } from "@react-router/node";
import { createServer } from "http";

const port = process.env.PORT || 10000;

// Import the build manifest
const { assets, routes, entry, basename, ssr } = await import("./build/server/index.js");

// Create the request handler
const requestHandler = createRequestHandler(
  { build: { assets, routes, entry, basename, ssr } }
);

// Create Node HTTP server
const server = createServer(async (req, res) => {
  try {
    // Convert Node request/response to Web Request/Response
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const webRequest = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
    });

    // Call the handler
    const webResponse = await requestHandler(webRequest);

    // Send response
    res.statusCode = webResponse.status;
    webResponse.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    res.end(await webResponse.text());
  } catch (error) {
    console.error("Request error:", error);
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Server Error</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`✅ ShareJoy server running on 0.0.0.0:${port}`);
});
