import ejs, { Data, Options } from "ejs";
import knex from "knex";
import Koa from "koa";
import type { Middleware } from "koa";

export type KoaOptions = ConstructorParameters<typeof Koa>[0];
export type KnexOptions = Parameters<typeof knex>[0];

const createKoaApp = (settings: KoaOptions) => {
  return new Koa(settings);
};

const createDatabaseConnection = (options: KnexOptions = {}) => knex(options);

export class Ejs {
  render(
    template: Parameters<(typeof ejs)["render"]>[0],
    data: Parameters<(typeof ejs)["render"]>[1],
    options: Parameters<(typeof ejs)["render"]>[2]
  ) {
    return ejs.render(template, data, options);
  }

  renderFile(
    path: Parameters<(typeof ejs)["renderFile"]>[0],
    data: Parameters<(typeof ejs)["renderFile"]>[1],
    options: Parameters<(typeof ejs)["renderFile"]>[2]
  ) {
    return ejs.renderFile(path, data, options);
  }
}

export class Application {
  //   private _koa: Koa;
  //   private _knex: Knex;

  constructor(
    private _ejs: typeof ejs,
    private _koa: Koa,
    private _knex: ReturnType<typeof knex>
  ) {}

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

const createApp = (
  koaOptions: KoaOptions = {},
  knexOptions: KnexOptions = {}
) =>
  new Application(
    ejs,
    createKoaApp(koaOptions),
    createDatabaseConnection(knexOptions)
  );

const app = createApp();
