import { spawn } from "child_process";

import { apps, games, softwares } from "../data/index.js";

import { startDev, startBuild, startSimulation } from "../scripts/index.js";

const projects = [...apps, ...games, ...softwares];

const mode = process.env.NODE_ENV;

console.log(mode);

if (mode === "development") startDev(projects);
if (mode === "production") startBuild(projects);
if (mode === "simulation") startSimulation(projects);
