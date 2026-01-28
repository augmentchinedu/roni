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
  const pad = " ".repeat(indent);
  let str = "{\n";

  for (const [key, value] of Object.entries(obj).sort()) {
    if (typeof value === "string") {
      // 🔥 if it's an import function, emit raw JS
      if (value.startsWith("() => import(")) {
        str += `${pad}${safeKey(key)}: ${value},\n`;
      } else {
        str += `${pad}${safeKey(key)}: "${value}",\n`;
      }
    } else {
      str += `${pad}${safeKey(key)}: ${objectToString(value, indent + 2)},\n`;
    }
  }

  str += " ".repeat(indent - 2) + "}";
  return str;
}

function makeEntry(filePath) {
  return `() => import("${filePath}")`;
}

/* ---------------- Walk pages recursively ---------------- */

async function walkPages(dir, projectRoot) {
  const tree = {};
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const name = path.basename(entry.name, ".vue");

    if (entry.isDirectory()) {
      tree[name] = await walkPages(fullPath, projectRoot);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".vue")) {
      const filePath =
        "/" + path.relative(projectRoot, fullPath).replace(/\\/g, "/");

      tree[name] = makeEntry(filePath);
    }
  }

  return tree;
}

/* ---------------- Package pages ---------------- */

export async function generatePackagePages(packageName) {
  if (!packageName) throw new Error("Package name is required");

  const PACKAGE_PAGES_DIR = path.join(PACKAGES_DIR, packageName, "pages");
  const OUTPUT_FILE = path.join(PACKAGE_PAGES_DIR, "index.js");

  try {
    await fs.access(PACKAGE_PAGES_DIR);
  } catch {
    console.warn(`⚠ No pages folder for "${packageName}"`);
    return;
  }

  const pagesTree = await walkPages(PACKAGE_PAGES_DIR, process.cwd());

  const content = `// ⚠ AUTO-GENERATED — DO NOT EDIT
// Package: ${packageName}

export default ${objectToString(pagesTree)};
`;

  await fs.writeFile(OUTPUT_FILE, content);
  console.info(`📦 pages/index.js generated for "${packageName}"`);
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
