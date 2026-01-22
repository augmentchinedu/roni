import { createWebHistory, createRouter } from "vue-router";

const routes = [
  { path: "/", component: () => import("../pages/Home.vue") },
  { path: "/about", component: () => import("../pages/404.vue") },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
