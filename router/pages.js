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
  dotpro: {
    About: () => import("./../packages/dotpro/pages/About.vue"),
    Contact: () => import("./../packages/dotpro/pages/Contact.vue"),
    Projects: () => import("./../packages/dotpro/pages/Projects.vue"),
    Splash: () => import("./../packages/dotpro/pages/Splash.vue"),
  },
  dotproperty: {
    Home: () => import("./../packages/dotproperty/pages/Home.vue"),
    Profile: () => import("./../packages/dotproperty/pages/Profile.vue"),
    Settings: () => import("./../packages/dotproperty/pages/Settings.vue"),
  },
  dotstore: {
    Cart: () => import("./../packages/dotstore/pages/Cart.vue"),
    Explore: () => import("./../packages/dotstore/pages/Explore.vue"),
    Home: () => import("./../packages/dotstore/pages/Home.vue"),
    Profile: () => import("./../packages/dotstore/pages/Profile.vue"),
    Shop: () => import("./../packages/dotstore/pages/Shop.vue"),
    Wishlist: () => import("./../packages/dotstore/pages/Wishlist.vue"),
    auth: {
      SignIn: () => import("./../packages/dotstore/pages/auth/SignIn.vue"),
      SignUp: () => import("./../packages/dotstore/pages/auth/SignUp.vue"),
    },
  },
  "expense-tracker": {
    Account: () => import("./../packages/expense-tracker/pages/Account.vue"),
    Analytics: () => import("./../packages/expense-tracker/pages/Analytics.vue"),
    Home: () => import("./../packages/expense-tracker/pages/Home.vue"),
    Transactions: () => import("./../packages/expense-tracker/pages/Transactions.vue"),
  },
  finance: {
    Home: () => import("./../packages/finance/pages/Home.vue"),
    Insights: () => import("./../packages/finance/pages/Insights.vue"),
    Me: () => import("./../packages/finance/pages/Me.vue"),
    Profile: () => import("./../packages/finance/pages/Profile.vue"),
    Settings: () => import("./../packages/finance/pages/Settings.vue"),
    Wallet: () => import("./../packages/finance/pages/Wallet.vue"),
  },
  "payment-splitter": {
    Home: () => import("./../packages/payment-splitter/pages/Home.vue"),
    Settings: () => import("./../packages/payment-splitter/pages/Settings.vue"),
    Split: () => import("./../packages/payment-splitter/pages/Split.vue"),
  },
  "the-great-unknown": {
    Home: () => import("./../packages/the-great-unknown/pages/Home.vue"),
    Settings: () => import("./../packages/the-great-unknown/pages/Settings.vue"),
  },
};
