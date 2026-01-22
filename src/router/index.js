import { createRouter, createWebHistory } from "vue-router";

export async function createAppRouter(packageName) {
  console.log(packageName);
  const routesModule = await import(
    /* @vite-ignore */
    `../../packages/${packageName}/src/routes.js`
  );

  return createRouter({
    history: createWebHistory(),
    routes: routesModule.default,
  });
}
