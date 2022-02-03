import { Knex } from "knex";
import faker from "faker";
import { Todo } from "../src/todos/todo";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("todos").del();

  // Inserts seed entries
  await knex<Todo>("todos").insert([
    { title: faker.lorem.words(), dueDate: faker.date.future() },
    { title: faker.lorem.words(), dueDate: faker.date.future() },
    { title: faker.lorem.words(), dueDate: faker.date.future() },
    { title: faker.lorem.words(), dueDate: faker.date.future() },
    { title: faker.lorem.words(), dueDate: faker.date.future() },
  ]);
}
