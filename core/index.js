import fs from "fs/promises";

import { apps, games, softwares } from "../data/index.js";

import {
  create,
  startDev,
  startBuild,
  startSimulation,
  startUpload,
  generatePackagePages,
  generateGlobalPages,
} from "../scripts/index.js";

const projects = [...apps, ...games, ...softwares];

const env = process.env.NODE_ENV;
const mode = process.argv[2];

await Promise.all(projects.map((project) => create(project)));

const packages = await fs.readdir("packages");

for (const pkg of packages) {
  await generatePackagePages(pkg);
}

await generateGlobalPages();

if (env === "development") startDev(projects);
if (env === "production") startBuild(projects);
if (env === "simulation") startSimulation(projects);
if (mode == "upload") startUpload(projects);
