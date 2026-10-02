import type { Database } from "@scream.js/database/db.js";
import type {
	CommandHandler,
	CommandHandlerFactory,
} from "./command-handler.js";

export class TransactionHandler<Command, Result = void>
	implements CommandHandler<Command, Result>
{
	readonly #db: Database;
	readonly #factory: CommandHandlerFactory<Command, Result>;

	constructor(db: Database, factory: CommandHandlerFactory<Command, Result>) {
		this.#db = db;
		this.#factory = factory;
	}

	execute(command: Command) {
		return this.#db.transaction((tx) =>
			this.#factory.create(tx).execute(command),
		);
	}
}
