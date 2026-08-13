const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");

const isDev = !app.isPackaged;
const PORT = Number(process.env.MAKINA_PORT || 3847);
let mainWindow = null;
let nextServer = null;
let serverReady = false;

function getUserDataDir() {
  const dir = path.join(app.getPath("userData"), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getDbPath() {
  return path.join(getUserDataDir(), "makina.db");
}

function resolveStandaloneDir() {
  // In packaged app: resources/app.asar.unpacked or app.asar/.next/standalone
  const candidates = [
    path.join(process.resourcesPath, "app.asar.unpacked", ".next", "standalone"),
    path.join(app.getAppPath(), ".next", "standalone"),
    path.join(__dirname, "..", ".next", "standalone"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "server.js")) || fs.existsSync(path.join(c, "package.json"))) {
      return c;
    }
  }
  return path.join(app.getAppPath(), ".next", "standalone");
}

function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      });
      req.on("error", retry);
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error("Servidor demorou demasiado a iniciar."));
        return;
      }
      setTimeout(attempt, 400);
    };
    attempt();
  });
}

async function startNextServer() {
  if (isDev) {
    // Dev expects `next dev` already running via npm script
    await waitForServer(`http://127.0.0.1:3000/api/health`, 120000);
    serverReady = true;
    return "http://127.0.0.1:3000";
  }

  const standaloneDir = resolveStandaloneDir();
  const serverEntry = path.join(standaloneDir, "server.js");

  if (!fs.existsSync(serverEntry)) {
    throw new Error(
      `Não foi possível encontrar o servidor Next.js em:\n${serverEntry}\n\nReconstrua a aplicação com npm run electron:build`
    );
  }

  // Copy static assets into standalone if needed
  const staticSrc = path.join(app.getAppPath(), ".next", "static");
  const staticDest = path.join(standaloneDir, ".next", "static");
  if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
    fs.mkdirSync(path.dirname(staticDest), { recursive: true });
    fs.cpSync(staticSrc, staticDest, { recursive: true });
  }

  const publicSrc = path.join(app.getAppPath(), "public");
  const publicDest = path.join(standaloneDir, "public");
  if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true });
  }

  const dbPath = getDbPath();
  const env = {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(PORT),
    HOSTNAME: "127.0.0.1",
    DATABASE_PATH: dbPath,
  };

  // Run Next standalone server with Electron's Node (process.execPath with ELECTRON_RUN_AS_NODE)
  nextServer = spawn(process.execPath, [serverEntry], {
    cwd: standaloneDir,
    env: {
      ...env,
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  nextServer.stdout.on("data", (d) => console.log(`[next] ${d}`));
  nextServer.stderr.on("data", (d) => console.error(`[next] ${d}`));
  nextServer.on("exit", (code) => {
    console.log(`Next server exited with code ${code}`);
    serverReady = false;
  });

  const url = `http://127.0.0.1:${PORT}`;
  await waitForServer(`${url}/api/health`, 90000);
  serverReady = true;
  return url;
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: "MAKINA — Software de Gestão",
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.loadURL(url);

  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function bootstrap() {
  try {
    const url = await startNextServer();
    createWindow(isDev ? "http://127.0.0.1:3000/login" : `${url}/login`);
  } catch (err) {
    console.error(err);
    dialog.showErrorBox(
      "MAKINA — Erro ao iniciar",
      err && err.message ? err.message : String(err)
    );
    app.quit();
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(bootstrap);

  app.on("window-all-closed", () => {
    if (nextServer && !nextServer.killed) {
      nextServer.kill();
    }
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", () => {
    if (nextServer && !nextServer.killed) {
      nextServer.kill();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && serverReady) {
      bootstrap();
    }
  });
}
