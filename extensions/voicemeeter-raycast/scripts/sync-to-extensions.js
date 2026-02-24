"use strict";

const fs = require("fs");
const path = require("path");

const extDir =
  process.env.RAYCAST_EXTENSIONS_PATH ||
  path.join(
    process.env.USERPROFILE || process.env.HOME || "",
    ".config",
    "raycast-x",
    "extensions",
    "voicemeeter-raycast"
  );

const distDir = path.join(__dirname, "..", "dist");

if (!fs.existsSync(distDir)) {
  console.warn("dist/ not found, skipping sync");
  process.exit(0);
}

if (!fs.existsSync(extDir)) {
  fs.mkdirSync(extDir, { recursive: true });
}

const reactPaths = [
  path.join(distDir, "node_modules", "react"),
  path.join(extDir, "node_modules", "react"),
];
for (const p of reactPaths) {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true });
  }
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  for (const name of fs.readdirSync(distDir)) {
    const src = path.join(distDir, name);
    const dest = path.join(extDir, name);
    if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) {
      fs.rmSync(dest, { recursive: true });
    }
    copyRecursive(src, dest);
  }
  console.log("Synced dist to", extDir);
} catch (err) {
  console.error("Sync failed:", err.message);
  process.exit(1);
}
