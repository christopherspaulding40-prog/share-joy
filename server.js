import { createServer } from "http";
import buildHandler from "./build/server/index.js";

const port = process.env.PORT || 3000;

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

    // Call the build handler directly
    const response = await buildHandler(request);
    
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
