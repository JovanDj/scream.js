import { Connection } from "@scream.js/database/connection.js";
import { Mapper } from "@scream.js/database/mapper.js";
import { SqlQueryVisitor } from "@scream.js/database/query-builder/query-builder-visitor.js";
import { QueryBuilder } from "@scream.js/database/query-builder/query-builder.js";
import { QueryVisitor } from "@scream.js/database/query-builder/query-visitor.js";
import { SqlQueryBuilder } from "@scream.js/database/query-builder/scream-query-builder.js";
import { Repository } from "@scream.js/database/repository.js";
import { HttpContext } from "@scream.js/http/http-context.js";
import { anything, deepEqual, instance, mock, verify, when } from "ts-mockito";
import { beforeEach, describe, it } from "vitest";
import { Todo } from "./todo.js";
import { TodoMapper } from "./todo.mapper.js";
import { TodoRepository } from "./todo.repository.js";
import { TodoRow } from "./todo.row.js";
import { TodosController } from "./todos.controller.js";

describe("TodosController", () => {
  let todosController: TodosController;
  let db: Connection;
  let todosRepository: Repository<Todo>;
  let contextMock: HttpContext;
  let todoMapper: Mapper<Todo, TodoRow>;
  let queryBuilder: QueryBuilder;
  let queryVisitor: QueryVisitor;

  beforeEach(() => {
    db = mock<Connection>();
    todoMapper = new TodoMapper();
    queryVisitor = new SqlQueryVisitor();
    queryBuilder = new SqlQueryBuilder(queryVisitor);

    todosRepository = new TodoRepository(
      instance(db),
      todoMapper,
      queryBuilder
    );
    todosController = new TodosController(todosRepository);

    contextMock = mock<HttpContext>();
  });

  describe("find all todos", () => {
    beforeEach(async () => {
      when(db.all(deepEqual("SELECT * FROM todos;"))).thenResolve([]);

      await todosController.findAll(instance(contextMock));
    });

    it("should return a list of todos", () => {
      // Todo: works, fix type
      verify(contextMock.json(deepEqual([]))).once();
    });
  });

  describe("find one todo", () => {
    beforeEach(() => {
      when(contextMock.id).thenReturn(1);
    });

    it("should find one todo", async () => {
      when(
        db.get(
          deepEqual("SELECT * FROM todos WHERE todo_id = ?;"),
          deepEqual(["1"])
        )
      ).thenResolve({
        todo_id: 1,
        title: "",
        updated_at: new Date(),
        created_at: new Date(),
        due_date: new Date(),
      });

      await todosController.findOne(instance(contextMock));
      verify(contextMock.json(anything())).once();
    });

    it("should return 404", async () => {
      when(
        db.get(
          deepEqual("SELECT * FROM todos WHERE todo_id = ?;"),
          deepEqual(["1"])
        )
      ).thenResolve(undefined);

      await todosController.findOne(instance(contextMock));
      verify(contextMock.notFound()).once();
    });
  });
});
