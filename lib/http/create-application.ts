/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { Application } from "./application.interface.js";
import { createExpressServer } from "./express/create-express-server.js";

type ApplicationImplementation = "express";

export interface ApplicationOptions {
  port: number;
}

const servers = new Map<
  ApplicationImplementation,
  (options: ApplicationOptions) => Application
>();

servers.set("express", createExpressServer);

export const createApplication = (
  server: ApplicationImplementation = "express",
  options = { port: 3000 }
) => {
  return servers.get(server)!(options);
};
