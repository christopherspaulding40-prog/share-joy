import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = process.env.PORT || 10000;

const clientDir = join(__dirname, "build", "client");
const indexPath = join(clientDir, "index.html");

// Initialize Prisma
const prisma = new PrismaClient({
  errorFormat: "pretty",
});

console.log("[Server] ✅ Prisma initialized");

// Cache client assets and index.html
const assetCache = new Map();
let indexHtml = "";

function loadAssets() {
  try {
    // Load index.html
    if (fs.existsSync(indexPath)) {
      indexHtml = fs.readFileSync(indexPath, "utf-8");
    }
    
    // Cache assets
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

    // API Routes (handle before React Router)
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

    // Try to serve static file first
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

    // For all other routes (including /app/*), serve index.html (SPA)
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(indexHtml);
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
        // Try to get settings from database
        let settings = await prisma.rewardSettings.findFirst();
        
        if (!settings) {
          // Create default settings if none exist
          settings = await prisma.rewardSettings.create({
            data: {},
          });
        }

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
        
        // Get or create settings record
        let existingSettings = await prisma.rewardSettings.findFirst();
        
        if (!existingSettings) {
          existingSettings = await prisma.rewardSettings.create({
            data: settings,
          });
        } else {
          existingSettings = await prisma.rewardSettings.update({
            where: { id: existingSettings.id },
            data: settings,
          });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, settings: existingSettings }));
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

        // Save reminder to database - send in 3 days
        const sendAt = new Date();
        sendAt.setDate(sendAt.getDate() + 3);
        
        const reminder = await prisma.reminderEmail.create({
          data: { email, sendAt },
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, message: "Reminder registered", reminder }));
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
  console.log(`🏠 Admin dashboard: /app`);
  console.log(`📂 Static assets: ${clientDir}`);
  console.log(`🔌 API endpoints: /apps/sharejoy/api/*`);
});
