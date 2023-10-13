import { HTTPContext } from "./http-context.js";

export type Handler = (context: HTTPContext) => unknown;
