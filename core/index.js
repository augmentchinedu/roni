import { spawn } from "child_process";

import { apps, games, softwares } from "../data/index.js";

import { startDev, startBuild } from "../scripts/index.js";

const projects = [...apps, ...games, ...softwares];

const mode = process.env.NODE_ENV;

console.log(mode);

if (mode === "development") startDev(projects);
else startBuild(projects);
