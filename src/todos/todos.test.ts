import { unlink } from "node:fs/promises";
import { Database } from "sqlite";
import { instance, mock, reset, verify, when } from "ts-mockito";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Controller } from "../../lib/controller";
import { ConnectionFactory } from "../../lib/database/connection-factory";
import { Gateway } from "../../lib/gateway";
import { Mapper } from "../../lib/mapper";
import { Repository } from "../../lib/repository";
import { Todo } from "./todo";
import { TodoGateway } from "./todo-gateway";
import { TodoMapper } from "./todo-mapper";
import { TodoRepository } from "./todo-repository";
import { TodosController } from "./todos.controller";

describe.concurrent("Todo Module", () => {
  let todosController: Controller<Todo>;
  let todoRepository: Repository<Todo>;
  let todoMapper: Mapper<Todo>;
  let todoGateway: Gateway<Todo>;
  let db: Database;

  describe("Integration", () => {
    beforeEach(async () => {
      db = await ConnectionFactory.createConnection();

      todoGateway = new TodoGateway(db);
      todoMapper = new TodoMapper(todoGateway);
      todoRepository = new TodoRepository(todoMapper);
      todosController = new TodosController(todoRepository);

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
      await unlink("test-database.db");
    });

    describe("Todo Controller", () => {
      it("should create todo controller", () => {
        expect(todosController).toBeInstanceOf(TodosController);
      });

      it("should get all todos", async () => {
        const todos = await todosController.findAll();
        expect(todos.length).toEqual(1);
      });

      it("should create todo", async () => {
        const todo = await todosController.create(new Todo());
        expect(todo).toBeInstanceOf(Todo);
        const todos = await todosController.findAll();
        expect(todos.length).toEqual(2);
      });
    });

    describe("Todo Repository", () => {
      it("should get all todos", async () => {
        const todos = await todoRepository.findAll();
        expect(todos.length).toEqual(1);
      });

      it("should insert todo", async () => {
        const todo = await todoRepository.insert({ title: "test2" });
        expect(todo).toBeInstanceOf(Todo);
      });
    });

    describe("Todo Mapper", () => {
      it("should create todo mapper", () => {
        expect(todoMapper).toBeInstanceOf(TodoMapper);
      });

      it("should find by id", async () => {
        const todo = await todoMapper.findById(1);
        expect(todo).toBeInstanceOf(Todo);
        expect(todo.id).toEqual(1);
        expect(todo.title).toEqual("test1");
      });

      it("should find first", async () => {
        const todo = await todoMapper.first();
        expect(todo).toBeInstanceOf(Todo);
        expect(todo.id).toEqual(1);
        expect(todo.title).toEqual("test1");
      });

      it("should find last", async () => {
        await db.run("INSERT INTO todos (title) VALUES (?)", "test2");
        const todo = await todoMapper.last();
        expect(todo).toBeInstanceOf(Todo);
        expect(todo.id).toEqual(2);
        expect(todo.title).toEqual("test2");
      });

      it("should find all", async () => {
        const todos = await todoMapper.findAll();
        const todo = todos[0];
        expect(todo).toBeInstanceOf(Todo);
        expect(todos.length).toBe(1);
        expect(todo.id).toEqual(1);
        expect(todo.title).toEqual("test1");
      });

      it("should create todo", async () => {
        const title = "todo2";
        const todo = new Todo();
        todo.title = title;
        const newTodo = await todoMapper.insert(todo);
        expect(newTodo).toBeInstanceOf(Todo);
        expect(newTodo.id).toEqual(2);
        expect(newTodo.title).toEqual(title);
      });

      it("should update todo", async () => {
        const id = 1;
        const changes = await todoMapper.update(id, {
          title: "test UPDATED"
        });
        expect(changes).toEqual(1);
      });

      it("should delete todo", async () => {
        const id = 1;
        const changes = await todoMapper.delete(id);
        expect(changes).toEqual(1);
      });
    });

    describe("Todo Gateway", () => {
      beforeEach(async () => {
        await db.run("INSERT INTO todos (title) VALUES (?)", "test2");
      });

      it("should create todo gateway", () => {
        expect(todoGateway).toBeInstanceOf(TodoGateway);
      });

      it("should find by id", async () => {
        const row = await todoGateway.findById(1);

        expect(row).toStrictEqual({ id: 1, title: "test1" });
      });

      it("should find all", async () => {
        const rows = await todoGateway.findAll();

        expect(rows).toStrictEqual([
          { id: 1, title: "test1" },
          { id: 2, title: "test2" }
        ]);
      });

      it("should find first", async () => {
        const row = await todoGateway.first();

        expect(row).toStrictEqual({ id: 1, title: "test1" });
      });

      it("should find last", async () => {
        const row = await todoGateway.last();

        expect(row).toStrictEqual({ id: 2, title: "test2" });
      });

      it("should insert new todo", async () => {
        const rows = await todoGateway.insert({ title: "test3" });
        const inserted = await todoGateway.findById(3);

        expect(rows).toStrictEqual({ lastID: 3, changes: 1 });
        expect(inserted).toStrictEqual({ id: 3, title: "test3" });
      });

      it("should update todo", async () => {
        const rows = await todoGateway.update(1, { title: "updated" });
        const updated = await todoGateway.findById(1);

        expect(rows).toStrictEqual(1);
        expect(updated).toStrictEqual({ id: 1, title: "updated" });
      });
    });
  });

  describe("Unit", () => {
    describe("TodoController", () => {
      let todoRepositoryMock: Repository<Todo>;
      let todosController: TodosController;

      beforeEach(() => {
        todoRepositoryMock = mock<Repository<Todo>>();

        when(todoRepositoryMock.findAll()).thenResolve([]);
        when(todoRepositoryMock.insert()).thenResolve(new Todo());

        todosController = new TodosController(instance(todoRepositoryMock));
      });
      afterEach(() => {
        reset(todoRepositoryMock);
      });

      it("should be defined", () => {
        expect(todosController).toBeInstanceOf(TodosController);
      });

      it("should return todos", async () => {
        const todos = await todosController.findAll();
        verify(todoRepositoryMock.findAll()).once();

        expect(todos.length).toBe(0);
      });
    });

    describe("Todo", () => {
      it("should set title", () => {
        const todo = new Todo();
        todo.title = "test";
        expect(todo.title).toEqual("test");
      });

      it("should get title", () => {
        const todo = new Todo();
        todo.title = "test";
        expect(todo.title).toEqual("test");
      });
    });
  });
});
