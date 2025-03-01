import { GroupByExpression } from "./expressions/group-by-expression.js";
import { HavingExpression } from "./expressions/having-expression.js";
import { JoinExpression } from "./expressions/join-expression.js";
import { LimitExpression } from "./expressions/limit-expression.js";
import { OffsetExpression } from "./expressions/offset-expression.js";
import { OrderByExpression } from "./expressions/order-by-expression.js";
import { WhereExpression } from "./expressions/where-expression.js";
import { SqlBuilder } from "./sql-builder.js";

export class FromBuilder extends SqlBuilder {
	where(condition: string) {
		return new FromBuilder([
			...this.expressions,
			new WhereExpression(condition),
		]);
	}

	orderBy(field: string, direction: "ASC" | "DESC" = "ASC") {
		return new FromBuilder([
			...this.expressions,
			new OrderByExpression(field, direction),
		]);
	}

	groupBy(fields: string) {
		return new FromBuilder([
			...this.expressions,
			new GroupByExpression(fields),
		]);
	}

	having(condition: string) {
		return new FromBuilder([
			...this.expressions,
			new HavingExpression(condition),
		]);
	}

	limit(limit: number) {
		return new FromBuilder([...this.expressions, new LimitExpression(limit)]);
	}

	offset(offset: number) {
		return new FromBuilder([...this.expressions, new OffsetExpression(offset)]);
	}

	join(
		table: string,
		condition: string,
		type: "INNER" | "LEFT" | "RIGHT" | "FULL" = "INNER",
	) {
		return new FromBuilder([
			...this.expressions,
			new JoinExpression(table, condition, type),
		]);
	}
}
