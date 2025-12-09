import { DeleteExpression } from "./expressions/delete-expression.js";
import { InsertExpression } from "./expressions/insert-expression.js";
import { SelectExpression } from "./expressions/select-expression.js";
import { UpdateExpression } from "./expressions/update-expression.js";
import { WhereExpression } from "./expressions/where-expression.js";
import { SelectBuilder } from "./select-builder.js";
import { SqlBuilder } from "./sql-builder.js";
import type { SqlPrimitive } from "./sql-query.js";

export class ScreamQueryBuilder extends SqlBuilder {
	select(fields: string) {
		return new SelectBuilder(
			[new SelectExpression(fields), ...this.expressions],
			[...this.params],
		);
	}

	insert(table: string, values: Record<string, SqlPrimitive>) {
		const entries = Object.entries(values).sort(([a], [b]) => {
			return a.localeCompare(b);
		});
		const columns = entries.map(([key]) => {
			return key;
		});
		const params = entries.map(([, value]) => {
			return value;
		});

		return new ScreamQueryBuilder(
			[new InsertExpression(table, columns)],
			[...params],
		);
	}

	update(table: string, values: Record<string, SqlPrimitive>) {
		const entries = Object.entries(values).sort(([a], [b]) => {
			return a.localeCompare(b);
		});
		const fields = entries.map(([key]) => {
			return key;
		});
		const params = entries.map(([, value]) => {
			return value;
		});
		const whereExpressions = this.expressions.filter((expression) => {
			return expression instanceof WhereExpression;
		});

		return new ScreamQueryBuilder(
			[new UpdateExpression(table, fields), ...whereExpressions],
			[...params, ...this.params],
		);
	}

	delete(table: string) {
		const whereExpressions = this.expressions.filter((expression) => {
			return expression instanceof WhereExpression;
		});

		return new ScreamQueryBuilder(
			[new DeleteExpression(table), ...whereExpressions],
			[...this.params],
		);
	}
}
