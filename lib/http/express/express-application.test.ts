import { Resource } from "@scream.js/resource.js";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { HttpContext } from "../http-context.js";
import { ExpressApp } from "./express-app.js";
import { ExpressApplication } from "./express-application.js";
import { ExpressFacade } from "./express-facade.js";
import { ExpressServer } from "./express-server.js";

describe("ExpressApplication", () => {
  let app: ExpressApplication;

  let expressApp: ExpressApp;

  beforeEach(() => {
    expressApp = express();
    const facade = new ExpressFacade(expressApp);
    app = new ExpressApplication(facade);
  });

  describe("it should listen on a port", () => {
    it("should start on a specified port", () => {
      const port = 3000;
      const server = app.listen(port);
      expect(server).toBeInstanceOf(ExpressServer);
      server.close();
    });
  });

  describe("createRouter method", () => {
    it("should create and use a router", async () => {
      app.createRouter("/test", (router) => {
        router.get("/", (ctx) => ctx.end());
      });

      const server = app.listen(3000);
      const response = await request(server.nodeServer).get("/test");

      expect(response.status).toBe(200);

      server.close();
    });
  });

  describe("resource method", () => {
    let mockedResource: Resource;

    beforeEach(() => {
      mockedResource = {
        index: async (ctx: HttpContext) => Promise.resolve(ctx.end()),
        show: async (ctx: HttpContext) => Promise.resolve(ctx.end()),
        create: async (ctx: HttpContext) => Promise.resolve(ctx.end()),
        store: async (ctx: HttpContext) => Promise.resolve(ctx.end()),
        edit: async (ctx: HttpContext) => Promise.resolve(ctx.end()),
        update: async (ctx: HttpContext) => Promise.resolve(ctx.end()),
        delete: async (ctx: HttpContext) => Promise.resolve(ctx.end()),
      };

      app.resource("/test", mockedResource);
    });

    it("should register find all route", async () => {
      const server = app.listen(3002);

      const response = await request(server.nodeServer).get("/test");
      expect(response.status).toBe(200);

      server.close();
    });

    it("should register find one route", async () => {
      const server = app.listen(3003);

      const response = await request(server.nodeServer).get("/test/1");
      expect(response.status).toBe(200);

      server.close();
    });

    it("should register create route", async () => {
      const server = app.listen(3004);

      const response = await request(server.nodeServer).get("/test/create");
      expect(response.status).toBe(200);

      server.close();
    });

    it("should register store route", async () => {
      const server = app.listen(3005);

      const response = await request(server.nodeServer).post("/test");
      expect(response.status).toBe(200);

      server.close();
    });

    it("should register edit route", async () => {
      const server = app.listen(3007);

      const response = await request(server.nodeServer).patch("/test/edit");
      expect(response.status).toBe(200);

      server.close();
    });

    it("should register update one route", async () => {
      const server = app.listen(3008);

      const response = await request(server.nodeServer).patch("/test/1");
      expect(response.status).toBe(200);

      server.close();
    });

    it("should register delete one route", async () => {
      const server = app.listen(3009);

      const response = await request(server.nodeServer).delete("/test/1");
      expect(response.status).toBe(200);

      server.close();
    });
  });
});
