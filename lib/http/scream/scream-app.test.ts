import supertest from "supertest";
import { describe, expect, it } from "vitest";
import { scream } from "./scream-app.js";

describe("ScreamApp", () => {
  describe("GET /", () => {
    it('should respond to GET request on /"', async () => {
      const app = scream();

      app.get("/", (req, res) => {
        res.send("Hello World!");
      });

      const res = await supertest(app).get("/");

      expect(res.status).toBe(200);
    });

    it('should respond with "Hello World!"', async () => {
      const app = scream();

      app.get("/", (req, res) => {
        res.send("Hello World!");
      });

      const res = await supertest(app).get("/");

      expect(res.text).toBe("Hello World!");
    });
  });

  describe("POST /", () => {
    it("should respond to POST on /", async () => {
      const app = scream();

      app.post("/", (req, res) => {
        res.send("Hello World!");
      });

      const res = await supertest(app).post("/");

      expect(res.status).toBe(200);
    });

    it("should respond with text", async () => {
      const app = scream();

      app.post("/", (req, res) => {
        res.send("Hello World!");
      });

      const res = await supertest(app).post("/");

      expect(res.text).toBe("Hello World!");
    });

    it("should parse JSON body of POST request", async () => {
      const app = scream();

      // Setting up a POST route that echoes the parsed body
      app.post("/echo", (req, res) => {
        res.send(req.body); // Echoing back the parsed body
      });

      // Test data
      const testData = { message: "Hello, world!" };

      // Making a POST request with JSON body and verifying the echoed response
      const response = await supertest(app)
        .post("/echo")
        .send(testData)
        .expect(200);

      expect(response.body).toEqual(testData);
      expect(response.headers["content-type"]).toContain("application/json");
    });
  });
});
