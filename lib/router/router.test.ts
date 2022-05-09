import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "./router";

describe("Router", () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  it("should create router", () => {
    expect(router).toBeInstanceOf(Router);
  });

  it("should add get route", () => {
    router.get("/", () => {
      return "success";
    });

    expect(router.routes.length).toEqual(1);
    expect(router.routes[0].path).toEqual("/");
    expect(router.routes[0].method).toEqual("GET");
    expect(router.routes[0].handler()).toEqual("success");
  });

  it("should add get async route", async () => {
    router.get("/", async () => {
      return "success";
    });

    expect(router.routes.length).toEqual(1);
    expect(router.routes[0].path).toEqual("/");
    expect(router.routes[0].method).toEqual("GET");
    expect(await router.routes[0].handler()).toEqual("success");
  });

  it("should get both sync async functions", async () => {
    router.get("/sync", () => {
      return "success";
    });

    router.get("/async", async () => {
      return "success";
    });

    expect(router.routes[0].path).toEqual("/sync");
    expect(router.routes[0].method).toEqual("GET");
    expect(router.routes[0].handler()).toEqual("success");

    expect(router.routes[1].path).toEqual("/async");
    expect(router.routes[1].method).toEqual("GET");
    expect(await router.routes[1].handler()).toEqual("success");
  });

  it("should add post route", async () => {
    router.post("/post", async () => {
      return "success";
    });

    expect(router.routes[0].path).toEqual("/post");
    expect(router.routes[0].method).toEqual("POST");
    expect(await router.routes[0].handler()).toEqual("success");
  });
});
