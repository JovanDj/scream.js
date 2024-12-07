import { DeleteExpression } from "./expressions/delete-expression.js";
import { FromExpression } from "./expressions/from-expression.js";
import { GroupByExpression } from "./expressions/group-by-expression.js";
import { HavingExpression } from "./expressions/having-expression.js";
import { InsertExpression } from "./expressions/insert-expression.js";
import { JoinExpression } from "./expressions/join-expression.js";
import { LimitExpression } from "./expressions/limit-expression.js";
import { OffsetExpression } from "./expressions/offset-expression.js";
import { OrderByExpression } from "./expressions/order-by-expression.js";
import { SelectExpression } from "./expressions/select-expression.js";
import { UpdateExpression } from "./expressions/update-expression.js";
import { WhereExpression } from "./expressions/where-expression.js";
import type { Join } from "./join.js";
import type { SqlExpression } from "./sql-expression.js";

export class ScreamQueryBuilder {
	readonly #expressions: readonly SqlExpression[];

	constructor(expressions: readonly SqlExpression[] = []) {
		this.#expressions = expressions;
	}

	private createQueryBuilder(expression: SqlExpression) {
		return new ScreamQueryBuilder([...this.#expressions, expression]);
	}

	select(fields = "*") {
		return this.createQueryBuilder(new SelectExpression(fields));
	}

	from(table: string) {
		return this.createQueryBuilder(new FromExpression(table));
	}

	where(condition: string) {
		return this.createQueryBuilder(new WhereExpression(condition));
	}

	orderBy(field: string, direction: "ASC" | "DESC" = "ASC") {
		return this.createQueryBuilder(new OrderByExpression(field, direction));
	}

	groupBy(fields: string) {
		return this.createQueryBuilder(new GroupByExpression(fields));
	}

	having(condition: string) {
		return this.createQueryBuilder(new HavingExpression(condition));
	}

	limit(limit: number) {
		return this.createQueryBuilder(new LimitExpression(limit));
	}

	offset(offset: number) {
		return this.createQueryBuilder(new OffsetExpression(offset));
	}

	join(table: string, condition: string, type: Join = "INNER") {
		return this.createQueryBuilder(new JoinExpression(table, condition, type));
	}

	insert(table: string, values: Record<string, number | string>) {
		return this.createQueryBuilder(new InsertExpression(table, values));
	}

	update(table: string, values: Record<string, number | string>) {
		return this.createQueryBuilder(new UpdateExpression(table, values));
	}

	delete(table: string) {
		return this.createQueryBuilder(new DeleteExpression(table));
	}

	build() {
		return this.#expressions
			.map((expression) => expression.interpret())
			.join(" ");
	}
}
