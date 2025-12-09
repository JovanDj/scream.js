import type { SqlExpression } from "./sql-expression.js";
import type { SqlPrimitive, SqlQuery } from "./sql-query.js";

export abstract class SqlBuilder {
	protected readonly expressions: readonly SqlExpression[];
	protected readonly params: readonly SqlPrimitive[];

	constructor(
		expressions: readonly SqlExpression[] = [],
		params: readonly SqlPrimitive[] = [],
	) {
		this.expressions = expressions;
		this.params = params;
	}

	build(): SqlQuery {
		return {
			params: [...this.params],
			sql: this.expressions
				.map((expression) => expression.interpret())
				.join(" "),
		};
	}
}
