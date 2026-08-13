// Preload intentionally minimal — renderer talks to the local Next.js API.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("makina", {
  platform: process.platform,
  isDesktop: true,
});
