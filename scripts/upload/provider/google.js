import path from "path";
import fs from "fs/promises";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET);

export async function uploadDirectory(name) {
  const projectDir = path.resolve("clients", name);
  const files = await walk(projectDir);

  for (const filePath of files) {
    const destination = path.relative(projectDir, filePath).replace(/\\/g, "/");

    await bucket.upload(filePath, {
      destination: `clients/${name}/${destination}`,
      gzip: true,
      metadata: {
        cacheControl: destination.endsWith(".html")
          ? "no-cache"
          : "public, max-age=31536000",
      },
    });
  }

  console.log(`✅ ${name} replaced`);
}

export async function deleteProjectPrefix(projectName) {
  const prefix = `clients/${projectName}/`;


  await bucket.deleteFiles({
    prefix,
    force: true, // IMPORTANT
  });
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(fullPath) : fullPath;
    })
  );

  return files.flat();
}
