import path from "path";
import fs from "fs/promises";
import { upload } from "./upload.js";

const CLIENTS_DIR = path.resolve("clients");

export async function startUpload(projects) {
  console.info("☁️ Uploading client projects...");

  for (const project of projects) {
    const projectDir = path.join(CLIENTS_DIR, project.id);

    try {
      await fs.access(projectDir);
    } catch {
      console.warn(`⚠️ Skipping ${project.id} (no build found)`);
      continue;
    }

    await upload({
      name: project.id,
      localDir: projectDir,
      remoteDir: project.id,
    });
  }

  console.info("✅ Upload complete");
}
