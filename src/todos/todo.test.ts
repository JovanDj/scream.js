import { describe, expect, it } from "vitest";
import { Todo } from "./todo.js";

describe("Todo", () => {
  it("should exist", () => {
    const todo = new Todo(0);
    expect(todo).toBeInstanceOf(Todo);
  });

  it("should be entity", () => {
    const todo = new Todo(0);
    expect(todo.id).toBeDefined();
  });

  it("should serialize json", () => {
    const todo = new Todo(1, "");

    const serialized = todo.toJSON();

    expect(serialized).toStrictEqual({
      id: 1,
      title: "",
    });
  });
});
