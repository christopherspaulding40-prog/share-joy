import { createServer } from "http";
import * as buildModule from "./build/server/index.js";

const port = process.env.PORT || 3000;

// The build exports everything as named exports, the handler is likely the default or first export
const requestHandler = buildModule.default || Object.values(buildModule)[0];

if (typeof requestHandler !== 'function') {
  console.error('No request handler found in build');
  process.exit(1);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? null : req,
    });

    const response = await requestHandler(request);
    
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
