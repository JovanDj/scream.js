import { describe, expect, it } from "vitest";
import { Todo } from "./todo.js";

describe.concurrent("Todo", () => {
  it("should exist", () => {
    const todo = new Todo();
    expect(todo).toBeInstanceOf(Todo);
  });

  it("should be entity", () => {
    const todo = new Todo();
    expect(todo.id).toBeDefined();
  });
});
