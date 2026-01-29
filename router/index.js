import { createRouter, createWebHistory } from "vue-router";
import { useStore } from "../store";

/* ---------------- Pages (build-time resolved) ---------------- */

// global pages
const { default: globalPages } = await import("global-pages/index.js");

// package pages (active package)
const { default: packagePages } = await import("package-pages/index.js");

function normalizePath(path) {
  if (!path) return null;

  // index → /
  if (path === "index") return "/";

  // /admin/index → /admin
  if (path.endsWith("/index")) {
    const base = path.replace(/\/index$/, "");
    return base || "/";
  }

  return path;
}

/* ---------------- Route builder ---------------- */

function buildRoutes(pages) {
  const routes = [];

  function walk(tree) {
    for (const key in tree) {
      const node = tree[key];

      // leaf page
      if (node.component) {
        const resolvedPath = normalizePath(node.path);

        routes.push({
          path: resolvedPath,
          name: key.toLowerCase(),
          component: node.component,
          meta: node.meta,
        });
        continue;
      }

      // nested group
      if (node.children) {
        walk(node.children);
      }
    }
  }

  walk(pages);
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

  // remove any real "/" route
  const filteredRoutes = routes.filter((r) => r.path !== "/");

  // inject redirect
  filteredRoutes.unshift({ path: "/", redirect: rootRedirect });

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
