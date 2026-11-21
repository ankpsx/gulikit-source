const { app, BrowserWindow } = require("electron");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const APP_ROOT = path.resolve(__dirname, "..");
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};
const CONTENT_SECURITY_POLICY = [
  "default-src 'self' blob:",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'"
].join("; ");

let localServer;
let localOrigin;
let mainWindow;

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, localOrigin).pathname);
  const relativePath = pathname === "/" ? "/editor/" :
    pathname.endsWith("/") ? pathname + "index.html" : pathname;
  const resolved = path.resolve(APP_ROOT, "." + relativePath);
  if (resolved !== APP_ROOT && !resolved.startsWith(APP_ROOT + path.sep)) {
    throw new Error("Path is outside the packaged application");
  }
  return resolved;
}

async function startLocalServer() {
  localServer = http.createServer(async (request, response) => {
    try {
      const filePath = resolveRequestPath(request.url || "/");
      const content = await fs.readFile(filePath);
      response.writeHead(200, {
        "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "Content-Length": content.length,
        "Cache-Control": "no-store",
        "Content-Security-Policy": CONTENT_SECURITY_POLICY,
        "X-Content-Type-Options": "nosniff"
      });
      response.end(content);
    } catch (error) {
      const status = error.code === "ENOENT" || error.code === "EISDIR" ? 404 : 400;
      response.writeHead(status, {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'"
      });
      response.end(status === 404 ? "Not found" : "Invalid local resource path");
    }
  });

  await new Promise((resolve, reject) => {
    localServer.once("error", reject);
    localServer.listen(0, "127.0.0.1", resolve);
  });
  localOrigin = `http://127.0.0.1:${localServer.address().port}`;
}

async function createMainWindow() {
  if (!localOrigin) await startLocalServer();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: "#0b1220",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    if (!targetUrl.startsWith(localOrigin + "/")) event.preventDefault();
  });
  mainWindow.on("closed", () => { mainWindow = null; });
  await mainWindow.loadURL(localOrigin + "/editor/");
}

const hasSingleInstance = app.requestSingleInstanceLock();
if (!hasSingleInstance) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createMainWindow).catch(error => {
    console.error("Failed to start GuliKit APG Editor:", error);
    app.quit();
  });

  app.on("activate", createMainWindow);
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("before-quit", () => {
    if (localServer) localServer.close();
  });
}
