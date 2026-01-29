// ⚠ AUTO-GENERATED — DO NOT EDIT
// Global pages

export default {
  admin: {
    children: {
      Index: {
        component: () => import("/pages/admin/Index.vue"),
        path: "/admin/index",
      },
    },
  },
  auth: {
    children: {
      SignIn: {
        component: () => import("/pages/auth/SignIn.vue"),
        path: "/auth/signin",
      },
      SignUp: {
        component: () => import("/pages/auth/SignUp.vue"),
        path: "/auth/signup",
      },
    },
  },
  error: {
    children: {
      NotFound: {
        component: () => import("/pages/error/NotFound.vue"),
        path: "/error/notfound",
      },
    },
  },
};
