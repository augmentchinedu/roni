import "uno.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

import { createAppRouter } from "./router";
import { useStore } from "./store";

const app = createApp(App);
const router = await createAppRouter();
const pinia = createPinia();

app.use(pinia);

const { initialize } = useStore();
await initialize();

app.use(router);
app.mount("#app");
