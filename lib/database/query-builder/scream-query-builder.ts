import { DeleteExpression } from "./expressions/delete-expression.js";
import { InsertExpression } from "./expressions/insert-expression.js";
import { SelectExpression } from "./expressions/select-expression.js";
import { UpdateExpression } from "./expressions/update-expression.js";
import { SelectBuilder } from "./select-builder.js";
import { SqlBuilder } from "./sql-builder.js";
import type { SqlExpression } from "./sql-expression.js";

export class ScreamQueryBuilder extends SqlBuilder {
	#createQueryBuilder(expression: SqlExpression) {
		return new ScreamQueryBuilder([...this.expressions, expression]);
	}

	select(fields: string) {
		return new SelectBuilder([new SelectExpression(fields)]);
	}

	insert(table: string, values: Record<string, number | string>) {
		return this.#createQueryBuilder(new InsertExpression(table, values));
	}

	update(table: string, values: Record<string, number | string>) {
		return this.#createQueryBuilder(new UpdateExpression(table, values));
	}

	delete(table: string) {
		return this.#createQueryBuilder(new DeleteExpression(table));
	}
}
