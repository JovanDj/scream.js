import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { app } from "./main.js";

describe("Server", () => {
  it("finds missing route", async () => {
    const res = await supertest(app.app).get("/missing");

    expect(res.notFound).toBeTruthy();
    expect(res.text).toContain("/missing");
  });

  it("finds all todos", async () => {
    const res = await supertest(app.app).get("/todos");

    expect(res.ok).toBeTruthy();
    expect(res.text).toStrictEqual("FIND ALL");
  });

  it("finds one todo", async () => {
    const res = await supertest(app.app).get("/todos/1");
    expect(res.ok).toBeTruthy();

    expect(res.text).toStrictEqual("FIND ONE");
  });

  it("creates a todo", async () => {
    const res = await supertest(app.app).post("/todos");
    expect(res.ok).toBeTruthy();

    expect(res.text).toStrictEqual("CREATE");
  });

  it("creates todo", async () => {
    const res = await supertest(app.app)
      .post("/todos")
      .set("Accept", "application/json")
      .field("title", "todo title");

    expect(res.status).toBe(201);
    expect(res.text).toStrictEqual("CREATE");
  });
});
