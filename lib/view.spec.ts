import nunjucks from "nunjucks";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NunjucksView } from "./nunjucks-view.js";

describe("NunjucksView.renderString", () => {
  beforeEach(() => {
    // Reset the mock before each test
    vi.resetAllMocks();
  });

  it("should correctly render a template with data", async () => {
    const view = new NunjucksView();
    const spy = vi.spyOn(nunjucks, "renderString");
    const template = "Hello, {{ name }}!";
    const data = { name: "World" };

    await view.renderString(template, data);
    expect(spy).toBeCalledWith(template, data);
  });
});

describe("NunjucksView without mocks", () => {
  it("renders a template string with data correctly", async () => {
    const view = new NunjucksView();
    const template = "Hello, {{ name }}!";
    const data = { name: "World" };

    const result = await view.renderString(template, data);

    expect(result).toBe("Hello, World!");
  });
});
