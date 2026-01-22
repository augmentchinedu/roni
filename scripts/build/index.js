import path from "path";
import { spawn } from "child_process";

const DIST_DIR = path.resolve("clients");

export function startBuild(projects) {
  console.info("🚀 Building all projects...");

  projects.forEach((project) => {
    const outDir = path.join(DIST_DIR, project.id);
    const child = spawn("npx", ["vite", "build", "--watch"], {
      cwd: path.resolve("."),
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PROJECT: project.id, // used in vite.config.js
      },
    });

    child.on("exit", (code) => {
      if (code === 0)
        console.log(`✅ Build complete for ${project} → ${outDir}`);
      else console.error(`❌ Build failed for ${project}`);
    });
  });

  console.info("✅ All builds started. Watch mode active.");
}
