import Pages from "./pages.js"; // global Pages import

// ---------------- Global pages ----------------
const GlobalPages = {
  Admin: () => import("../pages/admin/Index.vue"),
  NotFound: () => import("../pages/error/NotFound.vue"),
};

// Convert Pages object into routes array
function buildProjectRoutes(projectId) {
  const projectPages = Pages[projectId];
  if (!projectPages) return [];

  const routes = [];

  function walk(obj, pathAcc = "", nameAcc = []) {
    for (const key in obj) {
      const value = obj[key];
      const newPath = pathAcc + "/" + key.toLowerCase();
      const newName = [...nameAcc, key];

      if (typeof value === "function") {
        // Leaf → route
        routes.push({
          name: newName.join("-"),
          path: newPath === "/Home" ? "/" : newPath, // Home = root
          component: value,
        });
      } else if (typeof value === "object") {
        walk(value, newPath, newName);
      }
    }
  }

  walk(projectPages);

  return routes;
}

// ---------------- Root redirect ----------------
function resolveRootRedirect(routes) {
  const candidates = ["/splash", "/dashboard", "/home"];

  for (const path of candidates) {
    if (routes.find((r) => r.path === path || r.path === "/"))
      return path === "/home" ? "/" : path;
  }

  return routes.length ? routes[0].path : "/";
}

// ---------------- Build project routes ----------------
const projectRoutes = buildProjectRoutes(PROJECT.id);

// ---------------- Root redirect ----------------
const rootRedirect = resolveRootRedirect(projectRoutes);

// ---------------- Final routes ----------------
const routes = [
  {
    path: "/",
    redirect: rootRedirect,
  },

  // Global admin
  {
    path: "/admin",
    name: "admin",
    component: GlobalPages.Admin,
  },

  // Project-specific routes
  ...projectRoutes.filter((r) => r.path !== "/"),

  // 404 must be last
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: GlobalPages.NotFound,
  },
];

console.log("🔁 Root redirect →", rootRedirect);
console.log("📦 Routes:", routes);

export default routes;
