import { createServer } from "http";
import { build } from "./build/server/index.js";

const port = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? null : req,
    });

    const response = await build.default(request);
    
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
  } catch (error) {
    console.error("Error:", error);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(port, () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
});
