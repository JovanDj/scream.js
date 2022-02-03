import { Knex } from "knex";
import { Repository } from "../../lib/repository";
import { User } from "./user";

export class UsersRepository implements Repository<User> {
  constructor(private readonly knex: Knex);

  find(id: number): User {
    return this.knex.select().from("users").where("id", id);
  }
  insert(user: User): void {
    return this.knex.insert(user);
  }
  update(user: User): void {
    return this.knex.update(user);
  }
  delete(user: User): void {
    return this.knex.delete(user);
  }
}
