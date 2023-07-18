import { beforeEach, describe, expect, it } from "vitest";
import supertest from "supertest";
import { server } from "./server.js";

describe("Server", () => {
  let res: Awaited<supertest.Test>;

  it("finds missing route", async () => {
    const res = await supertest(server).get("/missing");

    expect(res.notFound).toBeTruthy();
  });

  describe("render html", () => {
    beforeEach(async () => {
      res = await supertest(server).get("/");
    });

    it("should return status 200", () => expect(res.ok).toBeTruthy());

    it("should return html document", () =>
      expect(res.type).toContain("text/html"));
  });

  describe("GET /todos", () => {
    beforeEach(async () => {
      res = await supertest(server).get("/todos");
    });

    it("should return status 200", () => expect(res.ok).toBeTruthy());

    it("should return text FIND ALL", () =>
      expect(res.text).toStrictEqual("FIND ALL"));
  });

  it("finds one todo", async () => {
    const res = await supertest(server).get("/todos/1");
    expect(res.ok).toBeTruthy();

    expect(res.text).toStrictEqual("FIND ONE");
  });

  it("creates a todo", async () => {
    const res = await supertest(server).post("/todos");
    expect(res.ok).toBeTruthy();

    expect(res.text).toStrictEqual("CREATE");
  });

  it("updates a todo", async () => {
    const res = await supertest(server).patch("/todos/1");
    expect(res.ok).toBeTruthy();

    expect(res.text).toStrictEqual("UPDATE");
  });
});
