import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getRandomPort } from "../getRandomPort.js";
import { createServer } from "./create-server.js";
import { Server } from "./server.interface.js";

const servers: Server[] = [
  createServer("express", { port: await getRandomPort() }),
  createServer("koa", { port: await getRandomPort() }),
];

describe.concurrent.each(servers)("Servers", (server) => {
  let app: ReturnType<typeof server.listen>;

  beforeEach(async () => {
    // Start the server for each implementation before the tests
    app = server.listen(await getRandomPort()); // Start on a random port
  });

  afterEach(() => {
    // Close the server after all tests for each implementation
    server.close();
  });

  it("should handle GET requests and return a response", async () => {
    const testPath = "/test";
    const testResponse = "Hello, World!";

    // Register a route handler for the current implementation
    server.get(testPath, (context) => {
      context.response.end(testResponse);
    });

    // Use supertest to make a GET request to the test path
    const response = await supertest(app).get(testPath);

    // Expect the response body to match the test response
    expect(response.text).toBe(testResponse);
  });

  it("should handle POST requests and return a response", async () => {
    const testPath = "/test";
    const testResponse = "Hello, World!";

    // Register a route handler for the current implementation
    server.post(testPath, (context) => {
      context.response.end(testResponse);
    });

    // Use supertest to make a GET request to the test path
    const response = await supertest(app).post(testPath);

    // Expect the response body to match the test response
    expect(response.text).toBe(testResponse);
  });

  // Add more test cases as needed
});
