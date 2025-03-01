import type { SqlExpression } from "./sql-expression.js";

export abstract class SqlBuilder {
	protected readonly expressions: readonly SqlExpression[];

	constructor(expressions: readonly SqlExpression[] = []) {
		this.expressions = expressions;
	}

	build() {
		return this.expressions
			.map((expression) => expression.interpret())
			.join(" ");
	}
}
