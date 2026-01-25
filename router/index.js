import { createRouter, createWebHistory } from "vue-router";
import routes from "./routes.js";
import { authenticate, analytics } from "../functions/guard.js";
import { useStore } from "../store/index.js";

const isToAuthenticate = AUTH ? AUTH == true : false;

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async () => {
  const { initialize } = useStore();

  await initialize();

  if (!isToAuthenticate) authenticate();

  analytics();
});

export default router;
