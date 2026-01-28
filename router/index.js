import { createRouter, createWebHistory } from "vue-router";
import { useStore } from "../store";

/* ---------------- Pages (build-time resolved) ---------------- */

// global pages
const { default: globalPages } = await import("global-pages/index.js");

// package pages
const { default: packagePages } = await import("package-pages/index.js");

/* ---------------- Loader resolver ---------------- */

function resolveLoader(path) {
  if (!path) return null;

  return () => import(/* @vite-ignore */ path);
}

/* ---------------- Route builder ---------------- */

function buildRoutes(pages, basePath = "") {
  const routes = [];

  for (const key in pages) {
    const value = pages[key];
    const lower = key.toLowerCase();

    const isIndex = lower === "index";
    const routePath = isIndex ? basePath || "/" : `${basePath}/${lower}`;

    // leaf node
    if (typeof value === "string") {
      routes.push({
        path: routePath,
        name:
          routePath === "/" ? "index" : routePath.replace(/\//g, "-").slice(1),
        component: resolveLoader(value),
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

function resolveRootRedirect(routes) {
  const priority = ["/splash", "/dashboard", "/home", "/apps"];

  for (const p of priority) {
    if (routes.some((r) => r.path === p)) return p;
  }

  return "/";
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

/* ---------------- Router factory ---------------- */

export async function createAppRouter() {
  const globalRoutes = buildRoutes(globalPages);
  const packageRoutes = buildRoutes(packagePages);

  const mergedRoutes = mergeRoutes(globalRoutes, packageRoutes);

  const rootRedirect = resolveRootRedirect(mergedRoutes);

  const routes = [
    { path: "/", redirect: rootRedirect },
    ...mergedRoutes.filter((r) => r.path !== "/"),
  ];

  /* ---------------- Debug logging ---------------- */

  console.group("📦 Router Routes");
  console.log("🔁 Root redirect →", rootRedirect);
  routes.forEach((r) => {
    console.log(r.path.padEnd(20), r.name || "redirect");
  });
  console.groupEnd();

  console.log(routes);
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  /* ---------------- Guards ---------------- */

  router.beforeEach(async (to, from, next) => {
    const store = useStore();

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
