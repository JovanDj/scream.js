import anyTest, { TestFn } from "ava";
import { Server } from "http";
import request from "supertest";
// Your server and models
import { server } from "../main";

const test = anyTest as TestFn<{ server: Server }>;

test.beforeEach(async t => {
  t.context.server = server.listen(3000);
});

test.afterEach(t => {
  t.context.server.close();
});

test("base url", async t => {
  const { server } = t.context;
  const res = await request(server).get("/");

  t.is(res.status, 200, "Wrong status code.");

  t.is(
    +res.headers["content-length"],
    +Buffer.byteLength(JSON.stringify(res.body)),
    "Wrong content-length"
  );

  t.is(res.headers["content-type"], "application/hal+json");

  t.deepEqual(res.body, {
    _links: {
      self: { href: "/" },
      todos: { href: "http://localhost:3000/todos" }
    }
  });
});
