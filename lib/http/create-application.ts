/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { createExpressServer } from "./express/create-express-server.js";

import process from "node:process";
import { Application } from "./application.interface.js";
import { ExpressApp } from "./express/express-app.js";

process.on("unhandledrejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

type ApplicationImplementation = "express";

export interface ApplicationOptions {
  port: number;
}

const servers = new Map<
  ApplicationImplementation,
  (options: ApplicationOptions) => Application<ExpressApp>
>();

servers.set("express", createExpressServer);

export const createApplication = (
  server: ApplicationImplementation = "express",
  options = { port: 3000 }
) => {
  return servers.get(server)!(options);
};
