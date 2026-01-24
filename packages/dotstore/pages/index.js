export default {
  Home: () => import("./Home.vue"),
  auth: {
    SignIn: () => import("./auth/SignIn.vue"),
    SignUp: () => import("./auth/SignUp.vue"),
  },
};
