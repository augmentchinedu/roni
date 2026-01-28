import path from "path";
import { spawn } from "child_process";
import { generatePackagePages } from "../pages/index.js";

const DIST_DIR = path.resolve("clients");
const isCI = process.env.CI === "true";

export function startBuild(projects) {
  console.info("🚀 Building all projects...");

  const builds = projects.map((project) => {
    if (!process.env.MACHINE) delete project.username;

    return new Promise(async (resolve, reject) => {
      try {

        const outDir = path.join(DIST_DIR, project.package);

        const args = ["vite", "build"];

        // 👇 watch ONLY in local dev
        if (!isCI) {
          args.push("--watch");
        }

        // 🔑 2. Spawn vite build
        const child = spawn("npx", args, {
          cwd: path.resolve("."),
          stdio: "inherit",
          shell: true,
          env: {
            ...process.env,
            NODE_ENV: "production",
            PACKAGE: project.package,
            USERNAME:project.username
          },
        });

        child.on("exit", (code) => {
          if (code === 0) {
            console.log(`✅ Build complete for ${project.package} → ${outDir}`);
            resolve();
          } else {
            console.error(`❌ Build failed for ${project.package}`);
            reject(new Error(`Build failed for ${project.package}`));
          }
        });
      } catch (err) {
        console.error(`❌ Page generation failed for ${project.package}`);
        reject(err);
      }
    });
  });

  if (isCI) {
    return Promise.all(builds)
      .then(() => {
        console.info("🏁 All CI builds completed successfully.");
        process.exit(0);
      })
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  }

  console.info("👀 Watch mode active (local dev).");
}
