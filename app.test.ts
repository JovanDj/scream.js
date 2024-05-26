import { createApplication } from "server.js";
import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

type GetResponse = Awaited<ReturnType<ReturnType<typeof supertest>["get"]>>;

describe("Todo app", () => {
  describe("non existent route", () => {
    let response: Awaited<ReturnType<ReturnType<typeof supertest>["get"]>>;

    beforeEach(async () => {
      response = await supertest(createApplication()).get("/not-found");
    });

    it("should not be found", () => {
      expect(response.notFound).toBeTruthy();
    });
  });

  describe("/todos", () => {
    describe("GET", () => {
      describe.each(["text/html", "application/json"])("%s", (mimeType) => {
        let response: GetResponse;

        beforeEach(async () => {
          response = await supertest(createApplication())
            .get("/todos")
            .set("Accept", mimeType);
        });

        it("should return status 200", () => {
          expect(response.statusCode).toBe(200);
        });
      });

      describe.each(["text/plain", "application/pdf"])("%s", (mimeType) => {
        let response: GetResponse;

        beforeEach(async () => {
          response = await supertest(createApplication())
            .get("/todos")
            .set("Accept", mimeType);
        });

        it("should return status 406", () => {
          expect(response.statusCode).toBe(406);
        });
      });
    });

    describe("POST", () => {
      let response: GetResponse;

      beforeEach(async () => {
        response = await supertest(createApplication())
          .post("/todos")
          .set("Accept", "text/html");
      });

      it("should not be supported", () => {
        expect(response.statusCode).toBe(405);
      });

      it("should return supported methods", () => {
        expect(response.header["allow"]).toBe("GET");
      });
    });
  });
});
