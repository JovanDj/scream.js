import { Todo } from "./todo.entity";

describe("Todo", () => {
  let todo: Todo;

  beforeEach(() => {
    todo = new Todo("test@mail.com");
  });

  it("should create todo", () => {
    expect(todo).toBeInstanceOf(Todo);
  });

  it("should get description", () => {
    expect(todo.description).toBe("test@mail.com");
  });

  it("should set description", () => {
    todo.description = "new-description.com";
    expect(todo.description).toBe("new-description.com");
    expect(todo.description).not.toBe("test@mail.com");
  });
});
