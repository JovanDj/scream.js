import KoaRouter from "@koa/router";

export function createKoaRouter(
  options?: ConstructorParameters<typeof KoaRouter>[0]
) {
  return new KoaRouter(options);
}
