import { spawn } from "child_process";

const BASE_PORT = 5173;

export function startDev(projects) {
  projects.forEach((project, i) => {
    const port = BASE_PORT + i;
    const child = spawn("vite", [], {
      env: {
        ...process.env,
        PORT: port,
        PROJECT: JSON.stringify(project),
        VITE_GRAPHQL_ENDPOINT: process.env.DEVELOPMENT_GRAPHQL_ENDPOINT,
      },
      stdio: "inherit",
    });

    child.on("close", (code) => {
      console.log(`${project.id} exited with code ${code}`);
    });

    console.log(`🚀 Starting ${project.id} on http://localhost:${port}`);
  });

  console.info("All projects have been created and dev servers started.");
}
