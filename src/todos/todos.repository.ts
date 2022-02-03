import { Knex } from "knex";
import { Repository } from "../../lib/repository";
import { Todo } from "./todo";

export class TodosRepository implements Repository<Todo> {
  constructor(private readonly knex: Knex);

  find(id: number): Todo {
    return this.knex.select().from("todos").where("id", id);
  }
  insert(todo: Todo): void {
    return this.knex.insert(todo);
  }
  update(todo: Todo): void {
    return this.knex.update(todo);
  }
  delete(todo: Todo): void {
    return this.knex.delete(todo);
  }
}
