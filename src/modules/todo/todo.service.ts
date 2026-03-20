import type { DatabaseHandle } from "@scream.js/database/db.js";
import type {
	TodoFindAllOptions,
	TodoUpdateInput,
	TodoWriteInput,
} from "./todo.js";
import { TodoMapper } from "./todo.mapper.js";

export class TodoService {
	readonly #db: DatabaseHandle;

	constructor(db: DatabaseHandle) {
		this.#db = db;
	}

	async findAll(options?: Readonly<TodoFindAllOptions>) {
		return TodoMapper.create(this.#db).findAll(options);
	}

	async findById(id: number) {
		return TodoMapper.create(this.#db).findById(id);
	}

	async create(input: Readonly<TodoWriteInput>) {
		return this.#db.transaction(async (tx) => {
			return TodoMapper.create(tx).insert(input);
		});
	}

	async update(id: number, input: Readonly<TodoUpdateInput>) {
		return this.#db.transaction(async (tx) => {
			const mapper = TodoMapper.create(tx);
			const todo = await mapper.findById(id);
			if (!todo) {
				return;
			}

			return mapper.update(todo.apply(input));
		});
	}

	async toggle(id: number) {
		return this.#db.transaction(async (tx) => {
			const mapper = TodoMapper.create(tx);
			const todo = await mapper.findById(id);
			if (!todo) {
				return;
			}

			return mapper.update(todo.toggle());
		});
	}

	async delete(id: number) {
		return TodoMapper.create(this.#db).delete(id);
	}
}
