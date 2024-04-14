import { Router } from "@scream.js/http/router.interface.js";

type Route = (router: Router) => void;

export const rootRoute: Route = (router) =>
  router.get("/", (ctx) =>
    ctx.render("./index", {
      name: "Jovan",
      message: "Rendered with nunjucks",
    })
  );
