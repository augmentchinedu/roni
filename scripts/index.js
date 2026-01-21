// /scripts/index.js
import fs from "fs/promises";
import path from "path";

export async function create(project) {
  const packagesDir = path.resolve("packages");
  const projectDir = path.join(packagesDir, project.id);

  // Ensure packages directory exists
  await fs.mkdir(packagesDir, { recursive: true });

  // Skip if project already exists
  try {
    await fs.access(projectDir);
    return;
  } catch {
    // Directory does not exist → continue
  }

  // Create project directory
  await fs.mkdir(projectDir);
  console.log(`Created project: ${project.id}`);
}

