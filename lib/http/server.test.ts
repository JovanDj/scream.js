import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getRandomPort } from "../getRandomPort.js";
import { createServer } from "./create-application.js";

const servers = [
  {
    server: createServer("express", { port: await getRandomPort() }),
    name: "express",
  },
  { server: createServer("koa", { port: await getRandomPort() }), name: "koa" },
];

describe.each(servers)("$name", ({ server }) => {
  let app: ReturnType<typeof server.listen>;

  beforeEach(async () => {
    // Close the server after all tests for each implementation

    // Start the server for each implementation before the tests
    app = server.listen(await getRandomPort()); // Start on a random port
  });

  it("should handle GET requests and return a response", async () => {
    const testPath = "/test";
    const testResponse = "Hello, World!";

    // Register a route handler for the current implementation

    // Use supertest to make a GET request to the test path
    const response = await supertest(app).get(testPath);

    // Expect the response body to match the test response
    expect(response.text).toBe(testResponse);
  });

  it("should handle POST requests and return a response", async () => {
    const testPath = "/test";
    const testResponse = "Hello, World!";

    // Register a route handler for the current implementation

    // Use supertest to make a GET request to the test path
    const response = await supertest(app).post(testPath);

    // Expect the response body to match the test response
    expect(response.text).toBe(testResponse);
  });

  // Add more test cases as needed
});
