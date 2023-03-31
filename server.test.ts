import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { server } from "./main.js";

describe.only("Server", () => {
  it("finds missing route", async () => {
    const res = await supertest(server).get("/missing");

    expect(res.notFound).toBeTruthy();
    expect(res.text).toStrictEqual("NOT FOUND");
  });

  it("finds all todos", async () => {
    const res = await supertest(server).get("/todos");

    expect(res.ok).toBeTruthy();
    expect(res.text).toStrictEqual("FIND ALL");
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

  it("finds all users", async () => {
    const res = await supertest(server).get("/users");
    expect(res.ok).toBeTruthy();

    expect(res.text).toStrictEqual("FIND ALL USERS");
  });

  it("creates todo", async () => {
    const res = await supertest(server)
      .post("/todos")
      .set("Accept", "application/json")
      .field("title", "todo title");

    expect(res.text).toStrictEqual("CREATE");
  });
});
