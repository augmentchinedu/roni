import { defineConfig } from "unocss";
import presetWind3 from "@unocss/preset-wind3";
import presetIcons from "@unocss/preset-icons";
import presetAttributify from "@unocss/preset-attributify";

export default defineConfig({
  presets: [presetWind3(), presetIcons(), presetAttributify()],
});
