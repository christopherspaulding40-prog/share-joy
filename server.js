import { createRequestHandler } from "@react-router/node";
import { getAssetFromKv } from "@shopify/remix-oxygen";
import { http, createServer } from "http";
import * as build from "./build/server/index.js";

const assetHandler = async (request) => {
  try {
    return await getAssetFromKv(new URL(request.url), build);
  } catch (error) {
    // Return not found
    return new Response("Not Found", { status: 404 });
  }
};

const requestHandler = createRequestHandler(build);

const server = createServer(async (req, res) => {
  const request = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: ["GET", "HEAD"].includes(req.method) ? null : req,
  });

  try {
    const response = await requestHandler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) {
      res.end(await response.text());
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Request handler error:", error);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
