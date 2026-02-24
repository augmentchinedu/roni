import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import path from "path";

const outputDir = path.resolve("dist");
if (!existsSync(outputDir)) mkdirSync(outputDir);

// Define targets: windows, macos, linux
const targets = [
  { name: "Windows", target: "windows-x64-20.5.0", file: "Roni.exe" },
  { name: "macOS", target: "macos-x64-20.5.0", file: "Roni.app" },
  { name: "Linux", target: "linux-x64-20.5.0", file: "roni" }
];

targets.forEach(({ name, target, file }) => {
  console.log(`\nBuilding ${name} executable...`);
  try {
    execSync(`nexe src/main.js -t ${target} -o ${path.join(outputDir, file)} -r "assets/**/*" --build`, {
      stdio: "inherit"
    });
    console.log(`${name} build complete: ${file}`);
  } catch (err) {
    console.error(`Error building ${name}:`, err.message);
  }
});

console.log("\nAll builds complete!");