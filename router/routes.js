// router/routes.js
import routesData from "../data/routes.json";
import { pages } from "../data";

let routes = routesData.routes
  .filter((route) => route.packages.includes("zendaa"))
  .map((route) => ({
    name: route.name,
    path: route.path,
    component: pages["zendaa"][route.component],
  }));

console.log(routes);

export default routes;
