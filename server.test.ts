import "reflect-metadata";

import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { server } from "./main.js";

describe.only("Server", () => {
  it("finds all todos", async () => {
    const res = await supertest(server).get("/todos");

    expect(res.text).toStrictEqual("FIND ALL");
  });

  it("finds one todo", async () => {
    const res = await supertest(server).get("/todos/1");

    expect(res.text).toStrictEqual("FIND ONE");
  });
});
