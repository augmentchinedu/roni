import { createRouter, createWebHistory } from "vue-router";
import { useStore } from "../store";

/* ---------------- Pages (build-time resolved) ---------------- */

// global pages
const { default: globalPages } = await import("global-pages/index.js");

// package pages (active package)
const { default: packagePages } = await import("package-pages/index.js");

/* ---------------- Loader resolver ---------------- */

function resolveLoader(path) {
  if (!path) return null;
  // Vite sees this at build time
  return () => import(/* @vite-ignore */ path);
}

/* ---------------- Route builder ---------------- */

function buildRoutes(pages, basePath = "") {
  const routes = [];

  for (const key in pages) {
    const value = pages[key];
    const lower = key.toLowerCase();
    const isIndex = lower === "index";

    // route path
    const routePath = isIndex ? basePath || "/" : `${basePath}/${lower}`;

    // ✅ route name: leaf only, kebab-case
    const routeName = isIndex
      ? "index"
      : lower.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

    if (typeof value === "function") {
      routes.push({
        path: routePath,
        name: routeName,
        component: value,
      });
      continue;
    }

    // nested folder
    if (typeof value === "object") {
      routes.push(...buildRoutes(value, routePath));
    }
  }

  return routes;
}

/* ---------------- Route merge ---------------- */

function mergeRoutes(globalRoutes, packageRoutes) {
  const map = new Map();

  // global first
  for (const r of globalRoutes) map.set(r.path, r);

  // package overrides global
  for (const r of packageRoutes) map.set(r.path, r);

  return [...map.values()];
}

/* ---------------- Root redirect ---------------- */

function resolveRootRedirect(routes) {
  const priority = ["/splash", "/dashboard", "/home"];
  for (const p of priority) {
    if (routes.find((r) => r.path === p)) return p;
  }
  // fallback: first route that is not "/"
  const first = routes.find((r) => r.path !== "/");
  return first?.path || "/";
}

/* ---------------- Router factory ---------------- */

export async function createAppRouter() {
  const globalRoutes = buildRoutes(globalPages);
  const packageRoutes = buildRoutes(packagePages);

  // merge: package overrides global
  const routes = mergeRoutes(globalRoutes, packageRoutes);

  // root redirect route
  const rootRedirect = resolveRootRedirect(routes);
  routes.unshift({ path: "/", redirect: rootRedirect });

  /* ---------------- Debug logging ---------------- */
  console.group("📦 Router Routes");
  routes.forEach((r) => console.log(r.path.padEnd(20), r.name));
  console.groupEnd();

  const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  /* ---------------- Guards ---------------- */
  router.beforeEach(async (to, from, next) => {
    const store = useStore();

    if (!store.app.isInitialized) {
      try {
        await store.initialize();
      } catch (err) {
        console.error("❌ App init failed", err);
        return next(false);
      }
    }

    if (to.meta?.auth && !store.auth.isAuthenticated) {
      return next("/auth/signin");
    }

    store.analytics?.track?.(to.fullPath);
    next();
  });

  router.afterEach((to) => {
    console.log("✅ Navigation resolved:", to.fullPath);
  });

  return router;
}
