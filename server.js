import { createServer } from "http";
import { createRequestHandler } from "@react-router/node";
import * as build from "./build/server/index.js";

const port = process.env.PORT || 3000;

const handler = createRequestHandler({
  build,
  mode: "production",
});

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Convert Node request to Fetch API Request
    let bodyBuffer = null;
    if (!["GET", "HEAD"].includes(req.method)) {
      bodyBuffer = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: bodyBuffer ? bodyBuffer : null,
    });

    const response = await handler(request);
    
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
  } catch (error) {
    console.error("Request error:", error);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(port, () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
});
