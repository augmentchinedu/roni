import { createRouter, createWebHistory } from "vue-router";
import routes from "./routes.js";
import { initialize, authenticate, analytics } from "../functions/guard.js";

const isToAuthenticate = AUTH ? AUTH == true : false;

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(() => {
  initialize();

  if (isToAuthenticate) authenticate();

  analytics();
});

export default router;
