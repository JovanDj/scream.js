import type { CommandController } from "../../lib/command.controller";
import type { Repository } from "../../lib/database/repository";
import { Todo } from "./todo";

export class CommandTodoController implements CommandController<Todo> {
  constructor(private readonly todoRepository: Repository<Todo>) {}

  async create() {
    return this.todoRepository.findById(1);
  }
}
