import { Database } from "@scream.js/database/database.js";
import { Repository } from "@scream.js/database/repository.js";
import { HTTPContext } from "@scream.js/http/http-context.js";
import { anything, deepEqual, instance, mock, verify, when } from "ts-mockito";
import { beforeEach, describe, it } from "vitest";
import { Todo } from "./todo.js";
import { TodoRepository } from "./todo.repository.js";
import { TodosController } from "./todos.controller.js";

describe("TodosController", () => {
  let todosController: TodosController;
  let db: Database;
  let todosRepository: Repository<Todo>;
  let contextMock: HTTPContext;

  beforeEach(() => {
    db = mock<Database>();
    todosRepository = new TodoRepository(instance(db));
    todosController = new TodosController(todosRepository);

    contextMock = mock<HTTPContext>();
  });

  describe("find all todos", () => {
    beforeEach(async () => {
      when(db.all(deepEqual("SELECT * FROM todos"))).thenResolve([]);

      await todosController.findAll(instance(contextMock));
    });

    it("should return a list of todos", () => {
      verify(contextMock.json(deepEqual({ todos: [] }))).once();
    });

    it("returns status 200", () => {
      verify(contextMock.status(200)).once();
    });

    it("should call db all method", () => {
      verify(db.all("SELECT * FROM todos")).once();
    });

    it("should open db before querying", () => {
      verify(db.connect()).calledBefore(db.all("SELECT * FROM todos"));
    });

    it("should close db after querying", () => {
      verify(db.close()).calledAfter(db.all("SELECT * FROM todos"));
    });
  });

  describe("find one todo", () => {
    beforeEach(async () => {
      when(
        db.get(
          deepEqual("SELECT * FROM todos WHERE todo_id = ?"),
          deepEqual(["1"]),
        ),
      ).thenResolve({
        todo_id: 1,
        title: "",
        updated_at: new Date(),
        created_at: new Date(),
        due_date: new Date(),
      });

      await todosController.findOne(instance(contextMock));
    });

    it("should find one todo", () => {
      verify(contextMock.json(anything())).once();
    });

    it("should return status 200", () => {
      verify(contextMock.status(200)).once();
    });

    it("should call db all method", () => {
      verify(
        db.get(
          deepEqual("SELECT * FROM todos WHERE todo_id = ?"),
          deepEqual(["1"]),
        ),
      ).once();
    });

    it("should open db before querying", () => {
      verify(db.connect()).calledBefore(
        db.get(
          deepEqual("SELECT * FROM todos WHERE todo_id = ?"),
          deepEqual(["1"]),
        ),
      );
    });

    it("should close db after querying", () => {
      verify(db.close()).calledAfter(
        db.get(
          deepEqual("SELECT * FROM todos WHERE todo_id = ?"),
          deepEqual(["1"]),
        ),
      );
    });
  });
});
