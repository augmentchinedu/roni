import { apps, games, softwares } from "../data/index.js";

import {
  startDev,
  startBuild,
  startSimulation,
  uploadToStorage,
} from "../scripts/index.js";

const projects = [...apps, ...games, ...softwares];

const env = process.env.NODE_ENV;
const mode = process.argv[2];

if (env === "development") startDev(projects);
if (env === "production") startBuild(projects);
if (env === "simulation") startSimulation(projects);
if (mode == "upload") uploadToStorage();
