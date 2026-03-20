export type TodoPriority = "low" | "medium" | "high";
export type TodoStatusCode = "open" | "completed";
export type TodoScope = "all" | "completed" | "dueToday" | "open" | "overdue";

export type TodoWriteInput = {
	description: string;
	dueAt: string | null;
	priority: TodoPriority;
	projectId: number | null;
	statusCode: TodoStatusCode;
	title: string;
};

export type TodoUpdateInput = TodoWriteInput;

export type TodoFindAllOptions = {
	projectId?: number;
	scope?: TodoScope;
	search?: string;
};

export type TodoSnapshot = {
	completedAt: string | null;
	createdAt: string;
	description: string;
	dueAt: string | null;
	id: number;
	priority: TodoPriority;
	projectId: number | null;
	statusCode: TodoStatusCode;
	title: string;
	updatedAt: string;
};

export class Todo {
	readonly #completedAt: string | null;
	readonly #createdAt: string;
	readonly #description: string;
	readonly #dueAt: string | null;
	readonly #id: number;
	readonly #priority: TodoPriority;
	readonly #projectId: number | null;
	readonly #statusCode: TodoStatusCode;
	readonly #title: string;
	readonly #updatedAt: string;

	constructor(snapshot: Readonly<TodoSnapshot>) {
		this.#completedAt = snapshot.completedAt;
		this.#createdAt = snapshot.createdAt;
		this.#description = snapshot.description;
		this.#dueAt = snapshot.dueAt;
		this.#id = snapshot.id;
		this.#priority = snapshot.priority;
		this.#projectId = snapshot.projectId;
		this.#statusCode = snapshot.statusCode;
		this.#title = snapshot.title;
		this.#updatedAt = snapshot.updatedAt;
	}

	get completedAt() {
		return this.#completedAt;
	}

	get createdAt() {
		return this.#createdAt;
	}

	get description() {
		return this.#description;
	}

	get dueAt() {
		return this.#dueAt;
	}

	get id() {
		return this.#id;
	}

	get priority() {
		return this.#priority;
	}

	get projectId() {
		return this.#projectId;
	}

	get statusCode() {
		return this.#statusCode;
	}

	get title() {
		return this.#title;
	}

	get updatedAt() {
		return this.#updatedAt;
	}

	apply(input: Readonly<TodoWriteInput>) {
		const now = new Date().toISOString();
		const completedAt =
			input.statusCode === "completed" ? (this.#completedAt ?? now) : null;

		return new Todo({
			completedAt,
			createdAt: this.#createdAt,
			description: input.description,
			dueAt: input.dueAt,
			id: this.#id,
			priority: input.priority,
			projectId: input.projectId,
			statusCode: input.statusCode,
			title: input.title,
			updatedAt: now,
		});
	}

	toggle() {
		return this.apply({
			description: this.#description,
			dueAt: this.#dueAt,
			priority: this.#priority,
			projectId: this.#projectId,
			statusCode: this.#statusCode === "completed" ? "open" : "completed",
			title: this.#title,
		});
	}
}
