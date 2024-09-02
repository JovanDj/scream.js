import { describe, expect, it } from "vitest";
import { createExpressApp } from "./express/create-express-application.js";
import { ExpressApp } from "./express/express-application.js";
import { createKoaApp } from "./koa/create-koa-application.js";
import { KoaApp } from "./koa/koa-application.js";

describe("create application", () => {
  it("should create an Express app by default", () => {
    const application = createExpressApp();
    expect(application).toBeInstanceOf(ExpressApp);
  });

  it("should create an Express app by selecting it in options", () => {
    const application = createKoaApp();
    expect(application).toBeInstanceOf(KoaApp);
  });
});
