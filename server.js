import { createServer } from "http";
import * as build from "./build/server/index.js";
import { createRequestHandler } from "@react-router/node";

const port = process.env.PORT || 3000;

const handler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  getLoadContext() {
    return {};
  },
});

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Collect request body
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
    
    res.statusCode = response.status;
    for (const [key, value] of response.headers) {
      res.setHeader(key, value);
    }
    
    if (response.body) {
      res.end(Buffer.from(await response.arrayBuffer()));
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Server error:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(port, () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
});
