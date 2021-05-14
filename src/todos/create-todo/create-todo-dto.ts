import { Todo } from "../todo.entity";

export type CreateTodoDto = Pick<Todo, "description">;
