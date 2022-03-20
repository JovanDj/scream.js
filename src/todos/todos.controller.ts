import { Repository } from "../../lib/repository";
import { Todo } from "./todo";

export class TodosController {
  constructor(private readonly todoRepository: Repository<Todo>) {}

  async findAll() {
    return this.todoRepository.findAll();
  }

  create() {
    const todo = new Todo();
    todo.title = `todo-${Math.random()}`;
    return this.todoRepository.insert(todo);
  }
}
