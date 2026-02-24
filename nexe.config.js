import path from "path";

export default {
    input: path.resolve("src/main.js"), // Your main entry file
    output: path.resolve("dist/roni"),  // Base output name; can override per OS
    target: [
        "windows-x64-22.3.0",
        "linux-x64-22.3.0",
        "macos-x64-22.3.0"
    ],
    build: false, // Set to true if you need to build Node from source
    resources: [
        "assets/**/*" // Include your assets (HTML/CSS/Chromium)
    ],
    clean: true,
    verbose: true
};