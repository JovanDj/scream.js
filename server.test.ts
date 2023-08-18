import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "./server.js";

describe.sequential("Server", () => {
  let res: Awaited<supertest.Test>;

  beforeEach(async () => {
    // const db = new SqliteDatabase("migration-test.sqlite");
    // await db.connect();
    // await db.run("DELETE FROM todos");
    // await db.close();
  });

  it("finds missing route", async () => {
    const res = await supertest(server).get("/missing");

    expect(res.notFound).toBeTruthy();
  });

  describe.only("GET /todos", () => {
    beforeEach(async () => {
      res = await supertest(server).get("/todos");
    });

    it("should return status 200", () => expect(res.ok).toBeTruthy());

    it("should return array of todos", () =>
      expect(res.body).toStrictEqual({ todos: [] }));
  });

  describe("GET /todos/:id", () => {
    beforeEach(async () => {
      res = await supertest(server).get("/todos/1");
    });

    it("finds one todo", () => expect(res.text).toStrictEqual("FIND ONE"));

    it("returns status 200", () => expect(res.ok).toBeTruthy());
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
