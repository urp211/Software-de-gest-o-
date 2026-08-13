import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./styles/app.css";
import { seedIfNeeded } from "./lib/db";

async function boot() {
  try {
    await seedIfNeeded();
  } catch (e) {
    console.error("Seed failed", e);
  }

  // Capacitor plugins (optional in browser)
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0f172a" });
  } catch {
    /* browser / nitron webview */
  }

  // HashRouter works on file://, Android WebView and PWA offline
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}

boot();
