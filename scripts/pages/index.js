import fs from "fs/promises";
import path from "path";

const PACKAGES_DIR = path.resolve("packages");
const PAGES_FILE = path.resolve("router/pages.js");
const GLOBAL_PAGES_DIR = path.resolve("pages"); // folder with global pages (Admin, NotFound, etc.)

/* ---------------- Helpers ---------------- */

function safeKey(key) {
  return /[-\s]/.test(key) || key === "*" ? `"${key}"` : key;
}

function arrowImport(importPath) {
  return `() => import("${importPath}")`;
}

function objectToString(obj, indent = 2) {
  const pad = " ".repeat(indent);
  let str = "{\n";

  for (const [key, value] of Object.entries(obj).sort()) {
    if (typeof value === "string") {
      str += `${pad}${safeKey(key)}: ${value},\n`;
    } else {
      str += `${pad}${safeKey(key)}: ${objectToString(value, indent + 2)},\n`;
    }
  }

  str += " ".repeat(indent - 2) + "}";
  return str;
}

/* ---------------- Walk pages ---------------- */

async function walkPages(dir, baseDir = dir) {
  const tree = {};
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const e of entries) {
    const full = path.join(dir, e.name);
    const name = path.basename(e.name, ".vue");

    if (e.isDirectory()) {
      tree[name] = await walkPages(full, baseDir);
    }

    if (e.isFile() && e.name.endsWith(".vue")) {
      const importPath = path
        .relative(path.dirname(PAGES_FILE), full)
        .replace(/\\/g, "/");
      tree[name] = arrowImport(`./${importPath}`);
    }
  }

  return tree;
}

/* ---------------- Main ---------------- */

export async function generatePages() {
  const packages = await fs.readdir(PACKAGES_DIR);
  const pagesRegistry = {};

  // Add global pages under "*"
  try {
    await fs.access(GLOBAL_PAGES_DIR);
    pagesRegistry["*"] = await walkPages(GLOBAL_PAGES_DIR, GLOBAL_PAGES_DIR);
  } catch {
    pagesRegistry["*"] = {};
  }

  // Add package pages
  for (const pkg of packages) {
    const pagesDir = path.join(PACKAGES_DIR, pkg, "pages");
    try {
      await fs.access(pagesDir);
      pagesRegistry[pkg] = await walkPages(pagesDir, pagesDir);
    } catch {
      // skip if package has no pages folder
    }
  }

  const content = `// THIS FILE IS AUTO-GENERATED\n// Global pages import registry\n\nexport default ${objectToString(
    pagesRegistry
  )};\n`;

  await fs.writeFile(PAGES_FILE, content);

  console.info(
    `📦 router/pages.js generated with packages (${packages.length}) + global pages`
  );
}
