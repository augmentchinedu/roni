// scripts/stage.js
import express from "express";
import path from "path";

const BASE_PORT = 3001;
const DIST_DIR = path.resolve("clients");

export function startSimulation(projects) {
  projects.forEach((project, i) => {
    const app = express();
    const port = BASE_PORT + i;
    const outDir = path.join(DIST_DIR, project.package);

    // Serve static files from the client folder
    app.use(express.static(outDir));
    app.listen(port, () => {
      console.log(
        `🚀 [SIMULATION] ${project.package} running at http://localhost:${port}`
      );
    });
  });
}
