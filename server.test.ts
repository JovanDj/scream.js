import request from "supertest";

import { server } from "./server";

describe("server", () => {
  beforeEach(() => {
    server.listen(3001);
  });

  afterEach(() => {
    server.close();
  });

  it("shoud return response", async (done) => {
    const response = await request(server).get("/");
    expect(response.text).toBe("test");
    done();
  });

  it("should get users", async (done) => {
    const response = await request(server).get("/users");
    expect(response.text).toBe("GET /users");
    done();
  });
});
