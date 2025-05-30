import type { HttpContext } from "./http-context.js";

export interface Index {
	index(ctx: Readonly<HttpContext>): Promise<void>;
}

export interface Show {
	show(ctx: Readonly<HttpContext>): Promise<void>;
}

export interface Create {
	create(ctx: Readonly<HttpContext>): Promise<void>;
}

export interface Store {
	store(ctx: Readonly<HttpContext>): Promise<void>;
}

export interface Edit {
	edit(ctx: Readonly<HttpContext>): Promise<void>;
}

export interface Update {
	update(ctx: Readonly<HttpContext>): Promise<void>;
}

export interface Delete {
	delete(ctx: Readonly<HttpContext>): Promise<void>;
}

export interface Readable extends Index, Show {}
export interface Writable extends Create, Store, Edit, Update, Delete {}
export interface Resource extends Readable, Writable {}
