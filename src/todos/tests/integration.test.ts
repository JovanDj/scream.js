import { Database } from "sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Controller } from "../../../lib/controller";
import { ConnectionFactory } from "../../../lib/database/connection-factory";
import { Todo } from "../todo";
import { TodosController } from "../todos.controller";

describe.concurrent("Todo Module", () => {
  let todosController: Controller<Todo>;
  let todo: Todo;
  let db: Database;

  describe("Integration", () => {
    beforeEach(async () => {
      db = await ConnectionFactory.createConnection();

      todo = new Todo(db);
      todosController = new TodosController(todo);

      try {
        await db.run(
          "CREATE TABLE todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)"
        );
        await db.run("INSERT INTO todos (title) VALUES (?)", "test1");
      } catch (error) {
        throw error;
      }
    });

    afterEach(async () => {
      await db.run("DROP TABLE todos");
      await db.close();
    });

    describe("Todo Controller", () => {
      it("should create todo controller", () => {
        expect(todosController).toBeInstanceOf(TodosController);
      });

      it("should get all todos", async () => {
        const todos = await todosController.findAll();
        expect(todos.length).toEqual(1);
        expect(todos).toStrictEqual([{ title: "test1", id: 1 }]);
      });

      it("should get todo by id", async () => {
        const todo = await todosController.findOne();
        expect(todo).toStrictEqual({ title: "test1", id: 1 });
      });

      it("should create todo", async () => {
        const todo = await todosController.create(new Todo());
        expect(todo).toBeInstanceOf(Todo);
        const todos = await todosController.findAll();
        expect(todos.length).toEqual(2);
      });
    });
  });
});
