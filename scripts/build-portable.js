/**
 * Builds a portable package for MAKINA Gestao.
 * Output: dist-exe/MAKINA-Gestao-1.0.0-Portable.zip
 *         (+ Electron .exe if binaries are available)
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "dist-exe");
const appDir = path.join(outDir, "MAKINA-Gestao-Portable");

function log(...args) {
  console.log("[package]", ...args);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function rimraf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  fs.cpSync(src, dest, { recursive: true });
}

function run(cmd) {
  log("$", cmd);
  execSync(cmd, {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0" },
  });
}

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error("too many redirects"));
    const lib = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    const req = lib.get(
      url,
      {
        rejectUnauthorized: false,
        headers: { "User-Agent": "makina-builder" },
        timeout: 120000,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          try {
            fs.unlinkSync(dest);
          } catch {}
          const next = res.headers.location.startsWith("http")
            ? res.headers.location
            : new URL(res.headers.location, url).href;
          return download(next, dest, redirects + 1).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          try {
            fs.unlinkSync(dest);
          } catch {}
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(dest)));
      }
    );
    req.on("error", (e) => {
      try {
        file.close();
        fs.unlinkSync(dest);
      } catch {}
      reject(e);
    });
  });
}

function prepareStandalone() {
  const st = path.join(root, ".next", "standalone");
  if (!fs.existsSync(path.join(st, "server.js"))) {
    log("Building Next.js…");
    run("npm run build");
  }

  copyDir(path.join(root, ".next", "static"), path.join(st, ".next", "static"));
  if (fs.existsSync(path.join(root, "public"))) {
    copyDir(path.join(root, "public"), path.join(st, "public"));
  }

  // better-sqlite3 shim (node:sqlite)
  const shimSrc = path.join(root, "vendor", "better-sqlite3");
  const shimDst = path.join(st, "node_modules", "better-sqlite3");
  rimraf(shimDst);
  copyDir(shimSrc, shimDst);

  // Ensure runtime deps exist in standalone
  for (const pkg of ["bcryptjs", "jose", "drizzle-orm"]) {
    const dst = path.join(st, "node_modules", pkg);
    const src = path.join(root, "node_modules", pkg);
    if (!fs.existsSync(dst) && fs.existsSync(src)) {
      copyDir(src, dst);
    }
  }

  // data folder placeholder inside standalone is not needed; package root has it
  return st;
}

async function tryElectron() {
  try {
    const distDir = path.join(root, "node_modules", "electron", "dist");
    if (!fs.existsSync(distDir)) {
      const ver = require(path.join(root, "node_modules", "electron", "package.json")).version;
      const zip = path.join(root, "node_modules", "electron", "electron-win.zip");
      ensureDir(path.dirname(zip));
      const urls = [
        `https://github.com/electron/electron/releases/download/v${ver}/electron-v${ver}-win32-x64.zip`,
        `https://npmmirror.com/mirrors/electron/v${ver}/electron-v${ver}-win32-x64.zip`,
      ];
      let ok = false;
      for (const u of urls) {
        try {
          log("Downloading Electron…", u);
          await download(u, zip);
          if (fs.statSync(zip).size > 10_000_000) {
            ok = true;
            break;
          }
        } catch (e) {
          log("download fail:", e.message);
        }
      }
      if (!ok) return false;
      ensureDir(distDir);
      execSync(`unzip -o "${zip}" -d "${distDir}"`, { stdio: "inherit" });
    }
    run("npx electron-builder --win portable --x64");
    return true;
  } catch (e) {
    log("electron-builder skipped:", e.message);
    return false;
  }
}

function buildFolderPackage(standalone) {
  log("Building portable folder…");
  rimraf(appDir);
  ensureDir(appDir);

  copyDir(standalone, path.join(appDir, "app"));
  ensureDir(path.join(appDir, "data"));
  fs.writeFileSync(path.join(appDir, "data", ".gitkeep"), "");

  const bat = `@echo off
chcp 65001 >nul
title MAKINA - Software de Gestao
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [ERRO] Node.js 22+ nao encontrado.
  echo  Instale em https://nodejs.org  (LTS 22 ou superior)
  echo  Depois execute novamente este ficheiro.
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node -p "process.versions.node"') do set NODEVER=%%i
echo Node.js %%NODEVER%%

set NODE_ENV=production
set PORT=3847
set HOSTNAME=127.0.0.1
set DATABASE_PATH=%~dp0data\\makina.db

echo.
echo  ============================================
echo   MAKINA - Software de Gestao Avancada
echo  ============================================
echo   Servidor: http://127.0.0.1:3847
echo   Acesso com credenciais da organização
echo   Feche esta janela para sair.
echo  ============================================
echo.

start "" "http://127.0.0.1:3847/login"
cd /d "%~dp0app"
node server.js
if errorlevel 1 (
  echo.
  echo  O servidor terminou com erro.
  pause
)
`;
  fs.writeFileSync(path.join(appDir, "Iniciar-MAKINA.bat"), bat, "utf8");

  // VBS launcher = double-click without console flash (optional)
  const vbs = `Set sh = CreateObject("Wscript.Shell")
sh.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
sh.Run "cmd /c Iniciar-MAKINA.bat", 1, False
`;
  fs.writeFileSync(path.join(appDir, "MAKINA.vbs"), vbs, "utf8");

  const sh = `#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node.js 22+ é necessário (https://nodejs.org)"
  exit 1
fi
export NODE_ENV=production
export PORT=3847
export HOSTNAME=127.0.0.1
export DATABASE_PATH="$(pwd)/data/makina.db"
echo "MAKINA → http://127.0.0.1:3847  "
(command -v xdg-open >/dev/null && xdg-open "http://127.0.0.1:3847/login") || true
(command -v open >/dev/null && open "http://127.0.0.1:3847/login") || true
cd app && exec node server.js
`;
  fs.writeFileSync(path.join(appDir, "iniciar-makina.sh"), sh, "utf8");
  fs.chmodSync(path.join(appDir, "iniciar-makina.sh"), 0o755);

  const readme = `MAKINA — Software de Gestão Avançada
=====================================

WINDOWS
-------
1. Instale Node.js 22+ : https://nodejs.org
2. Duplo-clique em Iniciar-MAKINA.bat  (ou MAKINA.vbs)
3. O browser abre em http://127.0.0.1:3847/login

LINUX / macOS
-------------
  chmod +x iniciar-makina.sh
  ./iniciar-makina.sh

CREDENCIAIS
-----------
  Utilizador : MAKINA
  Password   : (definida pela organização)

DADOS
-----
A base SQLite fica em data/makina.db (persistente).

GERAR .EXE NATIVO (Electron) num PC Windows:
  npm install
  npm run electron:build
→ dist-exe/MAKINA-Gestao-*-Portable.exe

Makina Company / Raul Lourenço · AGT Angola
`;
  fs.writeFileSync(path.join(appDir, "LEIA-ME.txt"), readme, "utf8");

  // Also write a simple HTML "desktop shortcut" helper
  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8"/>
<title>MAKINA — A iniciar…</title>
<meta http-equiv="refresh" content="0;url=http://127.0.0.1:3847/login"/>
<style>
body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.card{background:#1e293b;padding:2rem 2.5rem;border-radius:1rem;text-align:center;max-width:28rem}
h1{letter-spacing:.2em;margin:0 0 .5rem}
p{color:#94a3b8}
a{color:#60a5fa}
</style>
</head>
<body>
<div class="card">
  <h1>MAKINA</h1>
  <p>Se o servidor já estiver a correr, será redirecionado.<br/>
  Caso contrário execute <b>Iniciar-MAKINA.bat</b> primeiro.</p>
  <p><a href="http://127.0.0.1:3847/login">Abrir aplicação</a></p>
</div>
</body>
</html>`;
  fs.writeFileSync(path.join(appDir, "Abrir-no-Browser.html"), html, "utf8");

  const zipPath = path.join(outDir, "MAKINA-Gestao-1.0.0-Portable.zip");
  try {
    fs.unlinkSync(zipPath);
  } catch {}
  execSync(
    `cd "${outDir}" && zip -r -q "MAKINA-Gestao-1.0.0-Portable.zip" "MAKINA-Gestao-Portable"`,
    { stdio: "inherit" }
  );
  log("ZIP:", zipPath);
  return zipPath;
}

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  ensureDir(outDir);

  const standalone = prepareStandalone();
  const electronOk = await tryElectron();
  if (electronOk) log("Electron .exe gerado.");
  else log("Electron não disponível neste ambiente (rede). Pacote ZIP será gerado.");

  const zip = buildFolderPackage(standalone);
  log("DONE");
  for (const f of fs.readdirSync(outDir)) {
    const st = fs.statSync(path.join(outDir, f));
    log(" -", f, st.isDirectory() ? "(dir)" : `${(st.size / 1024 / 1024).toFixed(1)} MB`);
  }
  console.log("\nPacote principal:", zip);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
