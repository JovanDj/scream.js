import { SqliteDatabase } from "@scream.js/database/sqlite/sqlite-database.js";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { server } from "../server.js";

describe("Server", () => {
  let res: Awaited<supertest.Test>;

  afterEach(async () => {
    const db = new SqliteDatabase();
    const connection = await db.connect({ database: "migration-test.sqlite" });
    await connection.run("DELETE FROM todos");
    await connection.close();
  });

  it("finds missing route", async () => {
    const res = await supertest(server.server).get("/missing");

    expect(res.notFound).toBeTruthy();
  });

  describe("GET /todos", () => {
    beforeEach(async () => {
      res = await supertest(server.server).get("/todos");
    });

    it("should return status 200", () => {
      expect(res.ok).toBeTruthy();
    });

    it("should return array of todos", () => {
      expect(res.body).toStrictEqual({ todos: [] });
    });
  });

  describe("GET /todos/:id", () => {
    beforeEach(async () => {
      res = await supertest(server.server).get("/todos/1");
    });

    describe("when there are no todos", () => {
      it("returns status 404", () => {
        expect(res.status).toBe(404);
      });
      it("returns nothing", () => {
        expect(res.body).toStrictEqual({});
      });
    });
  });

  it("creates a todo", async () => {
    const res = await supertest(server.server).post("/todos");
    expect(res.redirect).toBeTruthy();
  });
});
