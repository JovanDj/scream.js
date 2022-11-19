import ejs, { Data, Options } from "ejs";
import type { Knex } from "knex";
import type Koa from "koa";
import type { Middleware } from "koa";

export class Ejs {
  render(template: string, data?: Data, options?: Options) {
    return ejs.render(template, data, options);
  }

  renderFile(path: string, data?: Data, options?: Options) {
    return ejs.renderFile(path, data, options);
  }
}

export class Application {
  //   private _koa: Koa;
  //   private _knex: Knex;

  constructor(private _ejs: Ejs, private _koa: Koa, private _knex: Knex) {}

  render(template: string, data?: Data, options?: Options) {
    return this._ejs.render(template, data, options);
  }

  async renderFile(path: string, data?: Data, options?: Options) {
    return this._ejs.renderFile(path, data, options);
  }

  use(middleware: Middleware) {
    this._koa.use(middleware);
  }

  listen() {
    this._koa.listen(3000);
  }

  get database() {
    return this._knex;
  }
}
