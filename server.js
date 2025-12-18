import { createServer } from "http";
import { getRequestHandler } from "@react-router/node";
import * as build from "./build/server/index.js";

const port = process.env.PORT || 10000;

// Create the React Router request handler
const requestHandler = getRequestHandler(build);

// Create HTTP server
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    
    // Collect body for POST/PUT/PATCH requests
    let bodyBuffer = Buffer.alloc(0);
    if (!["GET", "HEAD"].includes(req.method)) {
      bodyBuffer = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", chunk => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    // Create Request object
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: bodyBuffer.length > 0 ? bodyBuffer : null,
      duplex: "half",
    });

    // Get response from React Router
    const response = await requestHandler(request);

    // Send response back to client
    res.statusCode = response.status;
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    if (response.body) {
      res.end(await response.arrayBuffer());
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Server error:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server listening on 0.0.0.0:${port}`);
});
