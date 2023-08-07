import { describe, expect, it } from "vitest";
import { Todo } from "./todo.js";

describe("Todo", () => {
  it("should exist", () => {
    const todo = new Todo();
    expect(todo).toBeInstanceOf(Todo);
  });

  it("should be entity", () => {
    const todo = new Todo();
    expect(todo.id).toBeDefined();
  });

  it("should serialize json", () => {
    const todo = new Todo();
    todo.id = 1;
    todo.title = "";
    todo.createdAt = new Date("2023-08-07T19:42:01.011Z");
    todo.updatedAt = new Date("2023-08-07T19:42:01.011Z");
    todo.dueDate = new Date("2023-08-07T19:42:01.011Z");

    const serialized = todo.toJSON();

    expect(serialized).toStrictEqual({
      id: 1,
      title: "",
      createdAt: new Date("2023-08-07T19:42:01.011Z"),
      updatedAt: new Date("2023-08-07T19:42:01.011Z"),
      dueDate: new Date("2023-08-07T19:42:01.011Z"),
    });
  });
});
