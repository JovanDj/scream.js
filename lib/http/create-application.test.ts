import { describe, expect, it } from "vitest";
import { createApplication } from "./create-application.js";
import { ExpressApplication } from "./express/express-application.js";

describe("create application", () => {
  it("should create an Express app by default", () => {
    const application = createApplication();
    expect(application).toBeInstanceOf(ExpressApplication);
  });

  it("should create an Express app by selecting it in options", () => {
    const application = createApplication("express");
    expect(application).toBeInstanceOf(ExpressApplication);
  });
});
