import "@unocss/reset/normalize.css";
import "uno.css";
import "virtual:uno.css"; // <-- this loads reset + base + utilities

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

import { createAppRouter } from "./router";
import { useStore } from "./store";

import NavIcon from "./components/NavIcon.vue";

const app = createApp(App);
const router = await createAppRouter();
const pinia = createPinia();

app.use(pinia);

const { initialize } = useStore();
await initialize();

app.use(router);

app.component("NavIcon", NavIcon);

app.mount("#app");
