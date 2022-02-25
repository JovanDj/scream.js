import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";
import { TodoGateway } from "./todo-gateway";

describe.only("Todo", () => {
  let todoGateway: TodoGateway;
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

    todoGateway = new TodoGateway(db);

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
    expect(todoGateway).toBeInstanceOf(TodoGateway);
  });

  it("should find by id", async () => {
    const todo = await todoGateway.findById(1);

    expect(todo).toBeInstanceOf(TodoGateway);
    expect(todo.id).toEqual(1);
    expect(todo.title).toEqual("test1");
  });

  it("should find all", async () => {
    const todos = await todoGateway.findAll();
    const todo = todos[0];

    expect(todo).toBeInstanceOf(TodoGateway);
    expect(todo.id).toEqual(1);
    expect(todo.title).toEqual("test1");
  });

  it("should create todo", async () => {
    const title = "test2";
    const todo = await todoGateway.insert({ title });

    console.log(todo);

    expect(todo).toBeInstanceOf(TodoGateway);
    expect(todo.id).toEqual(2);
    expect(todo.title).toEqual(title);
  });

  it("should update todo", async () => {
    const id = 1;
    const changes = await todoGateway.update(id, {
      title: "test UPDATED"
    });

    expect(changes).toEqual(1);
  });

  it("should delete todo", async () => {
    const id = 1;
    const changes = await todoGateway.delete(id);

    expect(changes).toEqual(1);
  });
});
