// data/pages.js

export const pages = {
  "the-great-unknown": {
    Home: () => import("../packages/the-great-unknown/pages/Home.vue"),
    Dashboard: () => import("../packages/the-great-unknown/pages/Home.vue"),
  },
  zendaa: {
    Home: () => import("../packages/zendaa/pages/Home.vue"),
    Login: () => import("../packages/zendaa/pages/Home.vue"),
  },
};
