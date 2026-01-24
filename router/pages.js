// THIS FILE IS AUTO-GENERATED
// Global pages import registry

export default {
  dotstore: {
    Home: () => import("./../packages/dotstore/pages/Home.vue"),
    auth: {
      SignIn: () => import("./../packages/dotstore/pages/auth/SignIn.vue"),
      SignUp: () => import("./../packages/dotstore/pages/auth/SignUp.vue"),
    },
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
