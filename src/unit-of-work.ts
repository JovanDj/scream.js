import { Knex } from "knex";
import { TodosRepository } from "./todos/todos.repository";
import { UsersRepository } from "./users/users.repository";

export class UnitOfWork {
  users: UsersRepository;
  todos: TodosRepository;
  constructor(private readonly knex: Knex) {
    this.users = new UsersRepository(knex);
    this.todos = new TodosRepository(knex);
  }
}
