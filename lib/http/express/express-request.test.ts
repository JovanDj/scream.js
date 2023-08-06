import { beforeEach, describe, expect, it } from "vitest";

import { Request as Req } from "express";
import { instance, mock, when } from "ts-mockito";
import { ExpressRequest } from "./express-request.js";

describe("ExpressRequest", () => {
  let request: ExpressRequest;
  let incomingMessage: ReturnType<typeof mock<Req>>;

  beforeEach(() => {
    incomingMessage = mock<Req>();
    when(incomingMessage.url).thenReturn("/");

    request = new ExpressRequest(instance(incomingMessage));
  });

  it("should be defined", () => {
    expect(request).toBeDefined();
  });

  describe("method", () => {
    it.each([["GET"], ["POST"], ["PATCH"], ["PUT"], ["DELETE"]])(
      "should return %s",
      (method) => {
        when(incomingMessage.method).thenReturn(method);
        expect(request.method()).toStrictEqual(method);
      },
    );
  });

  describe("url", () => {
    it("should return url", () => {
      expect(request.url()).toStrictEqual("/");
    });
  });
});
