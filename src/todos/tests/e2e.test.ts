import { Database } from "sqlite";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConnectionFactory } from "../../../lib/database/connection-factory";
import { app } from "../../../main";

describe.skip("Todo Module", () => {
  let db: Database;

  beforeEach(async () => {
    db = await ConnectionFactory.createConnection();

    try {
      await db.run(
        "CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)"
      );
      await db.run("INSERT INTO todos (title) VALUES (?)", "test1");
    } catch (error) {
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await db.run("DROP TABLE IF EXISTS todos");
      await db.close();
    } catch (error) {
      throw error;
    }
  });

  describe("End to end", () => {
    describe("GET /todos", () => {
      it("responds with json", async () => {
        const response = await request(await app()).get("/todos");
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual([]);
      });
    });

    describe("GET /todos/:id", () => {
      it("responds with json", async () => {
        const response = await request(await app()).get("/todos/1");
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual([]);
      });
    });
  });
});
