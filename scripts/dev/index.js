import { spawn } from "child_process";

const BASE_PORT = 5173;

export function startDev(projects) {
  projects.forEach((project, i) => {
    const port = BASE_PORT + i;
    const child = spawn("vite", [], {
      env: {
        ...process.env,
        PORT: port,
        NODE_ENV: "development",
        PROJECT: JSON.stringify(project),
      },
      stdio: "inherit",
    });

    child.on("close", (code) => {
      console.log(`${project.package} exited with code ${code}`);
    });

    console.log(`🚀 Starting ${project.package} on http://localhost:${port}`);
  });

  console.info("All projects have been created and dev servers started.");
}
