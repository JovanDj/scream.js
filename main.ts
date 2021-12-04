import "reflect-metadata";

import { UsersController } from "./src/users/users.controller";
import { createServer } from "http";
import { Router } from "./lib/router";
import { Injector } from "./lib/injector";

const routes = [
  {
    path: "/users",
    method: "GET",
    handler: Injector.resolve<UsersController>(UsersController).findAll,
  },

  {
    path: "/users/1",
    method: "GET",
    handler: Injector.resolve<UsersController>(UsersController).findOne.name,
  },
];

const router = new Router(routes);

const main = async () => {
  const server = createServer();

  server.on("request", (req, res) => {
    router.match(req, res);
  });

  server.listen(3000);
};

main();
