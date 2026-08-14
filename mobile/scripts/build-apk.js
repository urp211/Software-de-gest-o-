/**
 * Builds MAKINA Android APK (offline-capable webview app).
 * Output: ../dist-apk/MAKINA-Gestao-1.0.0.apk
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "..");
const outDir = path.join(repoRoot, "dist-apk");
const cacheDir = path.join(os.homedir(), ".nitron", "android");

function log(...a) {
  console.log("[apk]", ...a);
}

function run(cmd) {
  log("$", cmd);
  execSync(cmd, {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0" },
  });
}

function ensureAapt2() {
  fs.mkdirSync(cacheDir, { recursive: true });
  const dest = path.join(cacheDir, "aapt2");
  if (fs.existsSync(dest)) return;
  const candidates = [
    path.join(root, "node_modules/aaptjs3/bin/x64/linux/aapt2"),
    "/home/user/tools/android-tools/node_modules/aaptjs3/bin/x64/linux/aapt2",
  ];
  const src = candidates.find((p) => fs.existsSync(p));
  if (!src) {
    throw new Error("aapt2 em falta. Execute: npm i -D aaptjs3");
  }
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, 0o755);
  log("aapt2 →", dest);
}

function ensureAndroidJar() {
  const dest = path.join(cacheDir, "android.jar");
  if (fs.existsSync(dest)) return;

  const jarCandidates = [
    path.join(root, "node_modules/autojs6-apkbuilder/build/libs/apkbuilder-cli.jar"),
    "/home/user/tools/autojs/package/build/libs/apkbuilder-cli.jar",
  ];
  const jar = jarCandidates.find((p) => fs.existsSync(p));
  if (!jar) {
    throw new Error(
      "android.jar em falta. Instale autojs6-apkbuilder ou coloque android.jar em ~/.nitron/android/"
    );
  }

  let AdmZip;
  try {
    AdmZip = require("adm-zip");
  } catch {
    AdmZip = require(path.join(root, "node_modules/nitron/node_modules/adm-zip"));
  }
  const z = new AdmZip(jar);
  const entry = z
    .getEntries()
    .find((e) => e.entryName.endsWith("frameworks/android/android-34.apk"));
  if (!entry) throw new Error("framework android-34.apk não encontrado");
  fs.writeFileSync(dest, entry.getData());
  log("android.jar (framework 34) →", dest);
}

function ensureJava() {
  if (process.env.JAVA_HOME) return;
  const candidates = [
    "/home/user/tools/jre-npm/node_modules/@node-plantuml-2/jre-linux-x64/jre",
    path.join(root, "node_modules/@node-plantuml-2/jre-linux-x64/jre"),
  ];
  const jre = candidates.find((p) => fs.existsSync(path.join(p, "bin/java")));
  if (jre) {
    process.env.JAVA_HOME = jre;
    process.env.PATH = `${path.join(jre, "bin")}${path.delimiter}${process.env.PATH}`;
    log("JAVA_HOME=", jre);
  }
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  ensureAapt2();
  ensureAndroidJar();
  ensureJava();

  log("Building web (Vite)…");
  run("npx vite build");

  log("Building APK (Nitron)…");
  run("npx nitron build");

  const apk = path.join(root, "dist", "app.apk");
  if (!fs.existsSync(apk)) throw new Error("APK não gerado em dist/app.apk");

  const named = path.join(outDir, "MAKINA-Gestao-1.0.0.apk");
  fs.copyFileSync(apk, named);
  fs.copyFileSync(apk, path.join(outDir, "MAKINA.apk"));

  const kb = (fs.statSync(named).size / 1024).toFixed(1);
  log("══════════════════════════════════════");
  log("APK pronto:", named);
  log("Tamanho:", kb, "KB");
  log("Package: com.makina.gestao");
  log("Acesso: credenciais da organização");
  log("══════════════════════════════════════");
}

main();
