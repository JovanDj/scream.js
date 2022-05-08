import { unlink } from "node:fs/promises";
import { Database } from "sqlite";
import { instance, mock, reset, verify, when } from "ts-mockito";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConnectionFactory } from "../../lib/database/connection-factory";
import { Repository } from "../../lib/repository";
import { Todo } from "./todo";
import { TodoGateway } from "./todo-gateway";
import { TodoMapper } from "./todo-mapper";
import { TodoRepository } from "./todo-repository";
import { TodosController } from "./todos.controller";

describe.concurrent("Todo Module", () => {
  let todosController: TodosController;
  let todoRepository: Repository<Todo>;
  let todoMapper: TodoMapper;
  let todoGateway: TodoGateway;
  let db: Database;

  describe("Integration", () => {
    beforeEach(async () => {
      db = await ConnectionFactory.createConnection();

      todoGateway = new TodoGateway(db);
      todoMapper = new TodoMapper(todoGateway);
      todoRepository = new TodoRepository(todoMapper);
      todosController = new TodosController(todoRepository);

      await db.run(
        "CREATE TABLE todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)"
      );
      await db.run("INSERT INTO todos (title) VALUES (?)", "test1");
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
        const todo = await todosController.create();
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
