import { Todo } from "../todo.entity";
import { CreateTodoDto } from "./create-todo-dto";
import { TodoCreated } from "./todo-created";

export class CreateTodo {
  constructor(private dto: CreateTodoDto) {}

  async execute(): Promise<Todo> {
    const { description } = this.dto;

    const user = new Todo(description);

    new TodoCreated(user);

    return user;
  }
}
