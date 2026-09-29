import type { Database } from "@scream.js/database/db.js";

export interface CommandHandler<Command, Result = void> {
	execute(command: Command): Promise<Result>;
}

export interface CommandHandlerFactory<Command, Result = void> {
	create(tx: Database): CommandHandler<Command, Result>;
}
