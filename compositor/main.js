/**
 * roni/compositor/main.js
 *
 * Roni Compositor — Vue 3 app bootstrap.
 * Loaded by Chromium. This IS the desktop.
 */

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { bus } from "./bus/RoniBus.js";

async function boot() {
  console.log("[compositor] Booting Roni compositor...");

  // Connect to kernel IPC bus
  try {
    await bus.connect();
  } catch (err) {
    console.warn(
      "[compositor] Kernel bus unavailable (dev mode?)",
      err.message
    );
  }

  // Mount Vue
  const app = createApp(App);
  app.use(createPinia());
  app.mount("#roni");

  console.log("[compositor] Roni compositor mounted.");
}

boot();
