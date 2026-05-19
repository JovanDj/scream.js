import knex, { type Knex } from "knex";
import config from "./knexfile.js";

export type Database = Knex;

export const createDB = (env?: string): Database =>
	knex(config[env ?? process.env["NODE_ENV"] ?? "development"] ?? "");
