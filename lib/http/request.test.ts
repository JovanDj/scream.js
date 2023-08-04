import { beforeEach, describe, expect, it } from "vitest";

import { IncomingMessage } from "node:http";
import { instance, mock, when } from "ts-mockito";
import { Request } from "./request.js";

describe("Request", () => {
  let request: Request;
  let incomingMessage: ReturnType<typeof mock<IncomingMessage>>;

  beforeEach(() => {
    incomingMessage = mock(IncomingMessage);
    when(incomingMessage.url).thenReturn("/");

    request = new Request(instance(incomingMessage));
  });

  it("should be defined", () => {
    expect(request).toBeDefined();
  });

  describe("method", () => {
    it.each([["GET"], ["POST"], ["PATCH"], ["PUT"], ["DELETE"]])(
      "should return %s",
      (method) => {
        when(incomingMessage.method).thenReturn(method);
        expect(request.method).toStrictEqual(method);
      },
    );
  });

  describe("url", () => {
    it("should return url", () => {
      expect(request.url).toStrictEqual("/");
    });
  });
});
