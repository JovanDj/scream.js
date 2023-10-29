import { Connection } from "@scream.js/database/connection.js";
import { Database } from "@scream.js/database/database.js";
import { SqliteDatabase } from "@scream.js/database/sqlite/sqlite-database.js";
import supertest from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { server } from "../server.js";

describe("Server", () => {
  let res: Awaited<supertest.Test>;
  let db: Database;
  let connection: Connection;

  beforeAll(async () => {
    db = new SqliteDatabase();
    connection = await db.connect({ database: "migration-test.sqlite" });
  });

  beforeEach(async () => {
    await connection.run("DELETE FROM todos");
  });

  afterAll(async () => {
    await connection.close();
  });

  it("renders html", async () => {
    res = await supertest(server.nodeServer).get("/");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  it("renders data in html", async () => {
    res = await supertest(server.nodeServer).get("/");

    expect(res.text).toMatch(/Rendered with/);
  });

  it("finds missing route", async () => {
    res = await supertest(server.nodeServer).get("/missing");

    expect(res.notFound).toBeTruthy();
  });

  describe("GET /todos", () => {
    beforeEach(async () => {
      res = await supertest(server.nodeServer).get("/todos");
    });

    it("should return status 200", () => {
      expect(res.ok).toBeTruthy();
    });

    it("should return array of todos", () => {
      expect(res.body).toStrictEqual({});
    });
  });

  describe("GET /todos/:id", () => {
    beforeEach(async () => {
      res = await supertest(server.nodeServer).get("/todos/1");
    });

    describe("when there are todos", () => {
      beforeEach(async () => {
        const insert = await connection.run(
          "INSERT INTO todos(title, due_date, updated_at, created_at) VALUES(?, ?, ?, ?)",
          [
            "test",
            new Date().toISOString(),
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );

        res = await supertest(server.nodeServer).get("/todos/" + insert.lastId);
      });

      it("returns status 200", () => {
        expect(res.status).toBe(200);
      });

      it("returns nothing", () => {
        expect(res.body.title).toStrictEqual("test");
      });
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
    const res = await supertest(server.nodeServer).post("/todos");
    expect(res.redirect).toBeTruthy();
  });
});
