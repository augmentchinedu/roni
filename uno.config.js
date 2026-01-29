import { defineConfig } from "unocss";
import presetWind4 from "@unocss/preset-wind4";
import presetIcons from "@unocss/preset-icons";
import presetAttributify from "@unocss/preset-attributify";

export default defineConfig({
  presets: [presetWind4({}), presetIcons(), presetAttributify()],
  rules: [
    // Ensure body/html have zero margin/padding
    ["html, body", { margin: "0", padding: "0", height: "100%" }],
  ],
});
