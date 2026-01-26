import path from "path";
import { spawn } from "child_process";

const DIST_DIR = path.resolve("clients");
const isCI = process.env.CI === "true";

export function startBuild(projects) {
  console.info("🚀 Building all projects...");

  const builds = projects.map((project) => {
    return new Promise((resolve, reject) => {
      const outDir = path.join(DIST_DIR, project.id);

      const args = ["vite", "build"];

      // 👇 watch ONLY in local dev
      if (!isCI) {
        args.push("--watch");
      }

      const child = spawn("npx", args, {
        cwd: path.resolve("."),
        stdio: "inherit",
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: "production",
          PROJECT: JSON.stringify(project),
          VITE_GRAPHQL_ENDPOINT: process.env.PRODUCTION_GRAPHQL_ENDPOINT,

        },
      });

      child.on("exit", (code) => {
        if (code === 0) {
          console.log(`✅ Build complete for ${project.id} → ${outDir}`);
          resolve();
        } else {
          console.error(`❌ Build failed for ${project.id}`);
          reject(new Error(`Build failed for ${project.id}`));
        }
      });
    });
  });

  if (isCI) {
    // CI: wait for all builds, then exit
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

  // Local dev: don't block, keep watching
  console.info("👀 Watch mode active (local dev).");
}
