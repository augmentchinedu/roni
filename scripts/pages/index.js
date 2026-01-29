// generatePages.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGES_DIR = path.resolve("packages");
const GLOBAL_PAGES_DIR = path.resolve("pages");

/* ---------------- Helpers ---------------- */

function safeKey(key) {
  // quote keys with special chars
  return /[-\s]/.test(key) ? `"${key}"` : key;
}

function objectToString(obj, indent = 2) {
  if (!obj || typeof obj !== "object") return "{}";

  const pad = " ".repeat(indent);
  let str = "{\n";

  for (const [key, value] of Object.entries(obj).sort()) {
    if (value === undefined) continue;

    if (typeof value === "string") {
      if (value.startsWith("() => import(")) {
        str += `${pad}${safeKey(key)}: ${value},\n`;
      } else {
        str += `${pad}${safeKey(key)}: "${value}",\n`;
      }
    } else if (typeof value === "object") {
      str += `${pad}${safeKey(key)}: ${objectToString(value, indent + 2)},\n`;
    }
  }

  str += " ".repeat(indent - 2) + "}";
  return str;
}

async function loadExistingPaths(indexFile) {
  try {
    const mod = await import("file://" + indexFile + "?t=" + Date.now());
    return extractPaths(mod.default);
  } catch {
    return {};
  }
}

function extractPaths(tree, acc = {}, prefix = []) {
  for (const [key, value] of Object.entries(tree)) {
    const current = [...prefix, key];

    if (value?.path) {
      acc[current.join(".")] = value.path;
    }

    if (value?.children) {
      extractPaths(value.children, acc, current);
    }
  }

  return acc;
}

function makeEntry(filePath) {
  return `() => import("${filePath}")`;
}

function buildPath(segments) {
  return "/" + segments.map((s) => s.toLowerCase()).join("/");
}

/* ---------------- Walk pages recursively ---------------- */
async function walkPages(dir, projectRoot, segments = []) {
  const tree = {};
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const name = path.basename(entry.name, ".vue");

    if (entry.isDirectory()) {
      tree[name] = {
        children: await walkPages(fullPath, projectRoot, [...segments, name]),
      };
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".vue")) {
      const filePath =
        "/" + path.relative(projectRoot, fullPath).replace(/\\/g, "/");

      const pageSegments = [...segments, name];

      tree[name] = {
        component: makeEntry(filePath),
        path: buildPath(pageSegments),
      };
    }
  }

  return tree;
}

function applyExistingPaths(tree, existing, prefix = []) {
  for (const [key, value] of Object.entries(tree)) {
    const current = [...prefix, key];
    const id = current.join(".");

    if (existing[id]) {
      value.path = existing[id];
    }

    if (value.children) {
      applyExistingPaths(value.children, existing, current);
    }
  }
}

export async function generatePackagePages(packageName) {
  const PACKAGE_PAGES_DIR = path.join(PACKAGES_DIR, packageName, "pages");
  const OUTPUT_FILE = path.join(PACKAGE_PAGES_DIR, "index.js");

  const existingPaths = await loadExistingPaths(OUTPUT_FILE);
  const pagesTree = await walkPages(PACKAGE_PAGES_DIR, process.cwd());

  applyExistingPaths(pagesTree, existingPaths);

  const content = `// ⚠ AUTO-GENERATED — DO NOT EDIT
// Package: ${packageName}

export default ${objectToString(pagesTree)};
`;

  await fs.writeFile(OUTPUT_FILE, content);
}

/* ---------------- Global pages ---------------- */

export async function generateGlobalPages() {
  const OUTPUT_FILE = path.join(GLOBAL_PAGES_DIR, "index.js");

  try {
    await fs.access(GLOBAL_PAGES_DIR);
  } catch {
    console.warn("⚠ No global pages directory");
    return;
  }

  const pagesTree = await walkPages(GLOBAL_PAGES_DIR, process.cwd());

  const content = `// ⚠ AUTO-GENERATED — DO NOT EDIT
// Global pages

export default ${objectToString(pagesTree)};
`;

  await fs.writeFile(OUTPUT_FILE, content);
  console.info("🌍 Global pages index.js generated");
}

/* ---------------- Generate all ---------------- */

export async function generateAllPages() {
  // global
  await generateGlobalPages();

  // all packages
  const packageDirs = await fs.readdir(PACKAGES_DIR, { withFileTypes: true });
  for (const dirent of packageDirs) {
    if (dirent.isDirectory()) {
      await generatePackagePages(dirent.name);
    }
  }
}
