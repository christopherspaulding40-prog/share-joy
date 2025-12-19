import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = process.env.PORT || 10000;

const clientDir = join(__dirname, "build", "client");

// Initialize Prisma
const prisma = new PrismaClient({
  errorFormat: "pretty",
});

console.log("[Server] ✅ Prisma initialized");

// Cache client assets
const assetCache = new Map();

function loadAssets() {
  try {
    const assetsDir = join(clientDir, "assets");
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      files.forEach((file) => {
        const filePath = join(assetsDir, file);
        const content = fs.readFileSync(filePath);
        assetCache.set(`/assets/${file}`, {
          content,
          type: getContentType(filePath),
        });
      });
    }
  } catch (e) {
    console.error("[Server] Error loading assets:", e.message);
  }
}

loadAssets();

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const pathname = url.pathname;

    // CORS headers for API
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    console.log(`[Server] ${req.method} ${pathname}`);

    // API Routes
    if (pathname.startsWith("/apps/sharejoy/api/")) {
      await handleApi(req, res, pathname, url.searchParams);
      return;
    }

    // Static assets (cached)
    if (assetCache.has(pathname)) {
      const { content, type } = assetCache.get(pathname);
      res.writeHead(200, { "Content-Type": type });
      res.end(content);
      return;
    }

    // Serve files from build/client
    let filePath = join(clientDir, pathname);
    const normalized = new URL(`file://${filePath}`).pathname;
    if (!normalized.startsWith(clientDir)) {
      filePath = join(clientDir, "index.html");
    }

    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const content = fs.readFileSync(filePath);
        const type = getContentType(filePath);
        res.writeHead(200, { "Content-Type": type });
        res.end(content);
        return;
      }
    } catch (e) {
      // File doesn't exist
    }

    // Default 404
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error) {
    console.error("[Server] Error:", error.message);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
});

async function handleApi(req, res, pathname, searchParams) {
  try {
    const body = await getRequestBody(req);

    // GET /apps/sharejoy/api/settings
    if (pathname === "/apps/sharejoy/api/settings" && req.method === "GET") {
      try {
        // For now, return mock settings - you'll connect this to your shop/settings table
        const settings = {
          widgetTitle: "🎁 Del & Få",
          widgetSubtitle: "Del din ordre på sociale medier og få din reward.",
          widgetButtonLabel: "Læs mere",
          widgetModalTitle: "🎁 Del & Få Rabat",
          widgetModalBody: "Upload et screenshot af din story, så sender vi din reward.",
          widgetStep1Text: "Tag et screenshot af din story med produktet",
          widgetStep2Text: "Del den på Instagram/TikTok",
          widgetStep3Text: "Få din rabatkode via email",
          backgroundColor: "#a855f7",
          accentColor: "#ec4899",
          textColor: "#ffffff",
          buttonColor: "#ffffff",
          buttonTextColor: "#a855f7",
          borderRadius: 8,
          designStyle: "gradient",
          amount: 10,
          valueType: "percentage",
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, settings }));
        return;
      } catch (error) {
        console.error("[API] Settings error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: error.message }));
        return;
      }
    }

    // POST /apps/sharejoy/api/settings (update)
    if (pathname === "/apps/sharejoy/api/settings" && req.method === "POST") {
      try {
        const settings = JSON.parse(body || "{}");
        // TODO: Save to database
        // await prisma.shopSettings.update(...);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, settings }));
        return;
      } catch (error) {
        console.error("[API] Settings update error:", error);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: error.message }));
        return;
      }
    }

    // POST /apps/sharejoy/api/reminder
    if (pathname === "/apps/sharejoy/api/reminder" && req.method === "POST") {
      try {
        const { email } = JSON.parse(body || "{}");

        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Invalid email" }));
          return;
        }

        // Save reminder to database
        // await prisma.reminderEmail.create({ data: { email } });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, message: "Reminder registered" }));
        return;
      } catch (error) {
        console.error("[API] Reminder error:", error);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: error.message }));
        return;
      }
    }

    // Default 404 for API
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "API endpoint not found" }));
  } catch (error) {
    console.error("[API] Error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, error: "Internal server error" }));
  }
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", reject);
  });
}

function getContentType(filePath) {
  const ext = filePath.toLowerCase().split(".").pop();
  const types = {
    html: "text/html; charset=utf-8",
    js: "application/javascript",
    mjs: "application/javascript",
    css: "text/css",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject",
    map: "application/json",
  };
  return types[ext] || "application/octet-stream";
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Server] SIGTERM received, shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`✅ ShareJoy server running on 0.0.0.0:${port}`);
  console.log(`📂 Serving: ${clientDir}`);
  console.log(`🔌 API ready at: /apps/sharejoy/api/*`);
});
