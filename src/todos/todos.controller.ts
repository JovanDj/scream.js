import { Todo } from "./todo";

export class TodosController {
  constructor(private readonly todo: Todo) {}

  async findAll() {
    const todos = this.todo.findAll();
    return todos;
  }

  async findOne(id: Todo["id"]) {
    return this.todo.findOne(id);
  }
}
