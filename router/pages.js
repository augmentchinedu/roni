// THIS FILE IS AUTO-GENERATED
// Global pages import registry

export default {
  "*": {
    admin: {
      Index: () => import("./../pages/admin/Index.vue"),
    },
    auth: {
      SignIn: () => import("./../pages/auth/SignIn.vue"),
      SignUp: () => import("./../pages/auth/SignUp.vue"),
    },
    error: {
      NotFound: () => import("./../pages/error/NotFound.vue"),
    },
  },
  dotstore: {
    Explore: () => import("./../packages/dotstore/pages/Explore.vue"),
    Home: () => import("./../packages/dotstore/pages/Home.vue"),
    auth: {
      SignIn: () => import("./../packages/dotstore/pages/auth/SignIn.vue"),
      SignUp: () => import("./../packages/dotstore/pages/auth/SignUp.vue"),
    },
  },
  spendly: {
    Home: () => import("./../packages/spendly/pages/Home.vue"),
  },
  "the-great-unknown": {
    Home: () => import("./../packages/the-great-unknown/pages/Home.vue"),
  },
  zendaa: {
    Home: () => import("./../packages/zendaa/pages/Home.vue"),
    auth: {
      SignUp: () => import("./../packages/zendaa/pages/auth/SignUp.vue"),
    },
  },
};
