// /scripts/index.js
import fs from "fs/promises";
import path from "path";

export async function create(project) {
  const packagesDir = path.resolve("packages");
  const projectDir = path.join(packagesDir, project.id);

  // Ensure packages directory exists
  await fs.mkdir(packagesDir, { recursive: true });

  // Skip if project already exists
  try {
    await fs.access(projectDir);
    return;
  } catch {
    // Directory does not exist → continue
  }

  // Create project directory
  await fs.mkdir(projectDir, { recursive: true });
  console.log(`Created project: ${project.id}`);

  // Scripts to inject
  const scripts = {
    dev: "vite",
    build: "vite build",
  };

  // package.json content
  const packageJson = {
    name: project.id,
    private: true,
    version: "0.0.0",
    type: "module",
    scripts,
  };

  // Write package.json
  const packageJsonPath = path.join(projectDir, "package.json");
  await fs.writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2),
    "utf-8"
  );
  console.log(`Created package.json for ${project.id}`);

  // --- Create vite.config.js if it doesn't exist ---
  const viteConfigPath = path.join(projectDir, "vite.config.js");

  try {
    await fs.access(viteConfigPath);
  } catch {
    // File does not exist → create it
    const viteConfigContent = `import { defineConfig, mergeConfig } from "vite";
import rootConfig from "../../vite.config.js";
import path from "path";

export default mergeConfig(
  rootConfig,
  defineConfig({
    root: path.resolve("../../"),
    server: {
      port: Number(process.env.PORT),
      strictPort: true
    }
  })
);
`;

    await fs.writeFile(viteConfigPath, viteConfigContent, "utf-8");
    console.log(`Created vite.config.js for ${project.id}`);
  }
}
