import express from "express";
import path from "node:path";
import nunjucks from "nunjucks";
import { Application } from "../application.interface.js";
import { ExpressApp } from "./express-application.js";

export const createExpressApp: () => Application = () => {
  console.info("Creating express app");
  const expressApp = express();

  expressApp.set("views", path.join(process.cwd(), "views"));
  expressApp.set("view engine", "njk");

  nunjucks
    .configure("views", {
      autoescape: true,
      express: expressApp,
      watch: true,
      noCache: true,
    })
    .addGlobal("viteScripts", () => {
      return `
      <script defer async type="module" src="http://localhost:5173/@vite/client"></script>
      <script defer async type="module" src="http://localhost:5173/resources/main.js"></script>
    `;
    });

  return new ExpressApp(expressApp);
};
