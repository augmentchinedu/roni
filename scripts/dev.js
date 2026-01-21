// /scripts/dev.js
import { readdir } from "fs/promises";
import { spawn } from "child_process";
import path from "path";

const PACKAGES_DIR = path.resolve("packages");
const BASE_PORT = 5174;

async function getPackages() {
  const entries = await readdir(PACKAGES_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

function startVite({ name, cwd, port }) {
  console.log(`🚀 Starting ${name} ${cwd} on http://localhost:${port}`);

  const child = spawn(
    "npx",
    ["vite", "--port", port.toString(), "--strictPort"],
    {
      cwd,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        PORT: port,
      },
    }
  );

  child.on("exit", (code) => {
    console.log(`🛑 ${name} exited with code ${code}`);
  });

  return child;
}

async function main() {
  const packages = await getPackages();

  // 1️⃣ Start root Vite (optional)
  startVite({
    name: "root",
    cwd: process.cwd(),
    port: 5173,
  });

  // 2️⃣ Start package Vite servers
  packages.forEach((pkg, index) => {
    startVite({
      name: pkg,
      cwd: path.join(PACKAGES_DIR, pkg),
      port: BASE_PORT + index,
    });
  });
}

main().catch(console.error);
