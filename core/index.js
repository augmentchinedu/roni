// /core/index.js

import { apps, games, softwares } from "../data";
import { create } from "../scripts";

export async function init() {
  // <-- make init async
  console.info("Running The Great Unknown - Development");
  console.info(`Games: ${games.length}`);
  console.info(`Apps: ${apps.length}`);
  console.info(`Softwares: ${softwares.length}`);

  const projects = [...apps, ...games, ...softwares];

  await Promise.all(projects.map((project) => create(project)));

  console.info("All projects have been created.");
}
