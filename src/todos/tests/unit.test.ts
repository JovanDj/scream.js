import { instance, mock, reset, verify, when } from "ts-mockito";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Repository } from "../../../lib/repository";
import { Todo } from "../todo";
import { TodosController } from "../todos.controller";

describe.concurrent("Todo Module", () => {
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
