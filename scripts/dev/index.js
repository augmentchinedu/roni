import { spawn } from "child_process";
import { generatePackagePages } from "../pages/index.js";

const BASE_PORT = 5173;

export async function startDev(projects) {
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const port = BASE_PORT + i;

    const child = spawn("vite", [], {
      env: {
        ...process.env,
        PORT: port,
        NODE_ENV: "development",
        PACKAGE: project.package,
        USERNAME: project.username
      },
      stdio: "inherit",
    });

    child.on("close", (code) => {
      console.log(`${project.package} exited with code ${code}`);
    });

    console.log(`🚀 Starting ${project.package} on http://localhost:${port}`);
  }

  console.info("All projects have been created and dev servers started.");
}
