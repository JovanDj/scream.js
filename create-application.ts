import knex from "knex";
import Koa from "koa";
import { Application, Ejs } from "./application.js";

export const createApplication = () => {
  return new Application(
    new Ejs(),
    new Koa(),
    knex({
      client: "sqlite",
      useNullAsDefault: true,
      asyncStackTraces: true,
      pool: { min: 0 },
      connection: {
        debug: true,
        filename: "./mydb.sqlite"
      }
    })
  );
};
