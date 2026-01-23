import { createRouter, createWebHistory } from "vue-router";
import routes from "./routes.js";
import { authenticate, analytics } from "../../functions/guard.js";

const isToAuthenticate = AUTH ? AUTH == true : false;

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(() => {
  console.log(isToAuthenticate);

  if (isToAuthenticate) authenticate();
  analytics()
});

export default router;
