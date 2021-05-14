import { Todo } from "../todo.entity";
import { CreateTodo } from "./create-todo";
import { CreateTodoDto } from "./create-todo-dto";

describe("Create todo command", () => {
  let dto: CreateTodoDto;
  let todo: Todo;

  beforeEach(async () => {
    dto = { description: "Todo description" };
    todo = await new CreateTodo(dto).execute();
  });

  it("should create todo", () => {
    expect(todo).toBeInstanceOf(Todo);
  });

  it("should create todo with correct inputs", () => {
    expect(todo.description).toBe(dto.description);
  });
});
