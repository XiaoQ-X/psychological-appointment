const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || ".");
const port = Number(process.argv[3] || 4173);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function safePath(urlPath) {
  const pathname = decodeURIComponent(String(urlPath || "/").split("?")[0]);
  const resolved = path.resolve(root, `.${pathname}`);
  return resolved.startsWith(root) ? resolved : null;
}

const server = http.createServer((req, res) => {
  let filePath = safePath(req.url);
  if (!filePath) {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, "index.html");
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(root, "index.html");
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    res.end(content);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static server: ${root} -> http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
