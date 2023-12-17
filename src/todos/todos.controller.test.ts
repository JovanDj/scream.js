/* eslint-disable @typescript-eslint/unbound-method */
import { Connection } from "@scream.js/database/connection.js";
import {
  DatabaseAccess,
  DatabaseFacade,
} from "@scream.js/database/database-facade.js";
import { Database } from "@scream.js/database/database.js";
import { Mapper } from "@scream.js/database/mapper.js";
import { SqlQueryVisitor } from "@scream.js/database/query-builder/query-builder-visitor.js";
import { QueryBuilder } from "@scream.js/database/query-builder/query-builder.js";
import { QueryVisitor } from "@scream.js/database/query-builder/query-visitor.js";
import { SqlQueryBuilder } from "@scream.js/database/query-builder/scream-query-builder.js";
import { Repository } from "@scream.js/database/repository.js";
import { SqliteDatabase } from "@scream.js/database/sqlite/sqlite-database.js";
import { HttpContext } from "@scream.js/http/http-context.js";
import { anything, deepEqual, instance, verify, when } from "ts-mockito";
import { beforeEach, describe, expect, it } from "vitest";
import { DeepMockProxy, MockProxy, mock, mockDeep } from "vitest-mock-extended";
import { Todo } from "./todo.js";
import { TodoMapper } from "./todo.mapper.js";
import { TodoRepository } from "./todo.repository.js";
import { TodoRow } from "./todo.row.js";
import { TodosController } from "./todos.controller.js";

describe("TodosController", () => {
  let todosController: TodosController;
  let connection: MockProxy<Connection>;
  let todosRepository: Repository<Todo>;
  let contextMock: DeepMockProxy<HttpContext>;
  let todoMapper: Mapper<Todo, TodoRow>;
  let queryBuilder: QueryBuilder;
  let queryVisitor: QueryVisitor;
  let databaseFacade: DatabaseAccess;
  let database: Database;

  beforeEach(() => {
    connection = mock<Connection>();
    todoMapper = new TodoMapper();
    queryVisitor = new SqlQueryVisitor();
    queryBuilder = new SqlQueryBuilder(queryVisitor);
    database = new SqliteDatabase();
    databaseFacade = new DatabaseFacade(database, connection, queryBuilder);

    todosRepository = new TodoRepository(databaseFacade, todoMapper);
    todosController = new TodosController(todosRepository);

    contextMock = mockDeep<HttpContext>({ funcPropSupport: true });
  });

  describe("find all todos", () => {
    beforeEach(async () => {
      connection.all
        .calledWith("SELECT * FROM todos;")
        .mockResolvedValueOnce([]);

      await todosController.findAll(instance(contextMock));
    });

    it("should return a list of todos", () => {
      // Todo: works, fix type
      expect(contextMock.json).toBeCalledWith([]);
    });
  });

  describe("find one todo", () => {
    beforeEach(() => {
      when(contextMock.id).thenReturn(1);
    });

    it("should find one todo", async () => {
      when(
        connection.get(
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
        connection.get(
          deepEqual("SELECT * FROM todos WHERE todo_id = ?;"),
          deepEqual(["1"])
        )
      ).thenResolve(undefined);

      await todosController.findOne(instance(contextMock));
      verify(contextMock.notFound()).once();
    });
  });
});
