import { apps, games, softwares } from "../data/index.js";

import {
  create,
  startDev,
  startBuild,
  startSimulation,
  startUpload,
  generatePages,
} from "../scripts/index.js";

const projects = [...apps, ...games, ...softwares];

const env = process.env.NODE_ENV;
const mode = process.argv[2];

await Promise.all(projects.map((project) => create(project)));

await generatePages();

if (env === "development") startDev(projects);
if (env === "production") startBuild(projects);
if (env === "simulation") startSimulation(projects);
if (mode == "upload") startUpload(projects);
