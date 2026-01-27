import Pages from "./pages.js"; // global Pages import

// ---------------- Helpers ----------------

// Convert Pages object into routes array
function buildProjectRoutes(projectId) {
  const projectPages = Pages[projectId];
  if (!projectPages) return [];

  const routes = [];

  function walk(obj, pathAcc = "", nameAcc = []) {
    for (const key in obj) {
      const value = obj[key];
      const newPath = pathAcc + "/" + key.toLowerCase();

      // Skip Index.vue files and NotFound.vue
      if (key === "Index" || key.toLowerCase() === "notfound") continue;

      if (typeof value === "function") {
        // Leaf → route
        routes.push({
          name: key.toLowerCase(),
          path: newPath === "/Home" ? "/" : newPath, // Home = root
          component: value,
        });
      } else if (typeof value === "object") {
        walk(value, newPath, key);
      }
    }
  }

  walk(projectPages);
  return routes;
}

// ---------------- Root redirect ----------------
function resolveRootRedirect(routes) {
  const candidates = ["/splash", "/dashboard", "/home"];

  for (const candidate of candidates) {
    const match = routes.find(
      (r) =>
        r.path.toLowerCase() === candidate.toLowerCase() || // exact match
        (candidate === "/home" && r.name.toLowerCase() === "home") // Home by name
    );

    if (match) return match.path; // return actual route path
  }

  // Fallback: first non-root route
  const first = routes.find((r) => r.path !== "/");
  return first ? first.path : "/";
}

// ---------------- Build routes ----------------

// Global routes (from "*")
const globalRoutes = buildProjectRoutes("*");

// Project routes
const projectRoutes = buildProjectRoutes(PROJECT.package);

// Merge routes, projectRoutes overwrite globalRoutes if path matches
const routeMap = new Map();

// Add global routes first
for (const r of globalRoutes) {
  routeMap.set(r.path, r);
}

// Add project routes (overwrite if path exists)
for (const r of projectRoutes) {
  routeMap.set(r.path, r);
}

// Convert map back to array
const mergedRoutes = Array.from(routeMap.values());

// Root redirect
const rootRedirect = resolveRootRedirect(mergedRoutes);

// ---------------- Final routes ----------------
const routes = [
  // Root redirect
  {
    path: "/",
    redirect: rootRedirect,
  },

  // All merged routes (except root)
  ...mergedRoutes.filter((r) => r.path !== "/"),

  // 404 must be last
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: Pages["*"].error.NotFound,
  },
];

console.log("🔁 Root redirect →", rootRedirect);
console.log("📦 Routes:", routes);

export default routes;
