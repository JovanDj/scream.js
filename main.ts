import { createApplication } from "./create-application.js";

export class User {
  get name() {
    return this._name;
  }
  set name(name) {
    this._name = name;
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
  }
  constructor(private _id: number, private _name: string) {}
}

const app = createApplication();

await app.database.schema.createTableIfNotExists("users", table => {
  table.increments("user_id", { primaryKey: true });
  table.string("name").notNullable();
});

app.use(async ctx => {
  const { name } = ctx.query;
  await app.database.insert({ name }).into("users");

  ctx.body = await app.renderFile("./index.html", {
    name: ctx.query["name"],
    message: "Hello"
  });
});

app.listen();
