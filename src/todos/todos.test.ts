import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";
import { Todo } from "./todo";
import { TodoMapper } from "./todo-mapper";

describe.only("TodoMapper", () => {
  let todoMapper: TodoMapper;
  let db: Database;

  beforeEach(async () => {
    try {
      db = await open({
        filename: "test-database.db",
        driver: sqlite3.Database
      });
    } catch (err) {
      console.log(err);
    }

    todoMapper = new TodoMapper(db);

    await db.run(
      "CREATE TABLE todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)"
    );

    await db.run("INSERT INTO todos (title) VALUES (?)", "test1");
  });

  afterEach(async () => {
    await db.run("DROP TABLE todos");
    await db.close();
  });

  it("should create todo gateway", () => {
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
    const title = "test2";
    const todo = await todoMapper.insert({ title });

    expect(todo).toBeInstanceOf(Todo);
    expect(todo.id).toEqual(2);
    expect(todo.title).toEqual(title);
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
