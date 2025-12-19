import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildClientDir = path.join(__dirname, "..", "build", "client");

// Create index.html if it doesn't exist
const indexPath = path.join(buildClientDir, "index.html");
const indexContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ShareJoy Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/entry.client-4wvlSLRz.js"></script>
  </body>
</html>`;

try {
  // Ensure build/client directory exists
  if (!fs.existsSync(buildClientDir)) {
    fs.mkdirSync(buildClientDir, { recursive: true });
  }

  // Write index.html
  fs.writeFileSync(indexPath, indexContent, "utf-8");
  console.log("[postbuild] ✅ Created index.html at", indexPath);
} catch (err) {
  console.error("[postbuild] ❌ Error creating index.html:", err.message);
  process.exit(1);
}
